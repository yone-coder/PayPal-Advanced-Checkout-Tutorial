/**
 * PayPal Payment Integration
 * Enhanced version with improved structure and error handling
 */

class PayPalIntegration {
  constructor() {
    // Configuration
    this.config = {
      apiBaseUrl: "https://paypal-with-nodejs.onrender.com",
      paypalSdkUrl: "https://www.paypal.com/sdk/js",
      clientId: "AU23YbLMTqxG3iSvnhcWtix6rGN14uw3axYJgrDe8VqUVng8XiQmmeiaxJWbnpbZP_f4--RTg146F1Mj",
      currency: "USD",
      intent: "capture"
    };

    // State management
    this.state = {
      currentCustomerId: null,
      orderId: null,
      hostedFields: null
    };

    // Initialize the integration
    this.initialize();
  }

  /**
   * Main initialization method
   */
  async initialize() {
    try {
      this.setupEventListeners();
      await this.checkUserLoginStatus();
      const clientToken = await this.getClientToken();
      await this.loadPayPalSDK(clientToken);
      await this.initializePaymentForm();
    } catch (error) {
      console.error('PayPal Integration initialization failed:', error);
      this.displayErrorAlert();
    }
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    document.addEventListener("click", (event) => {
      if (event.target.classList.contains("ms-close")) {
        this.handleAlertClose(event);
      }
    });
  }

  /**
   * Handle alert close functionality
   */
  handleAlertClose(event) {
    const alertElement = event.target.closest(".ms-alert");
    if (alertElement) {
      alertElement.remove();
    }
  }

  /**
   * Check if user is logged in
   */
  async checkUserLoginStatus() {
    return new Promise((resolve) => {
      this.state.currentCustomerId = localStorage.getItem("logged_in_user_id") || "";
      resolve();
    });
  }

  /**
   * Get client token from server
   */
  async getClientToken() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/get_client_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: this.state.currentCustomerId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Failed to get client token:', error);
      throw error;
    }
  }

  /**
   * Dynamically load PayPal SDK
   */
  async loadPayPalSDK(clientToken) {
    const scriptAttributes = {
      src: `${this.config.paypalSdkUrl}?client-id=${this.config.clientId}&enable-funding=venmo&currency=${this.config.currency}&intent=${this.config.intent}&components=hosted-fields`,
      "data-client-token": clientToken
    };

    return this.loadScript(scriptAttributes);
  }

  /**
   * Generic script loader utility
   */
  loadScript(attributes) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      
      Object.entries(attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });

      script.addEventListener('load', resolve);
      script.addEventListener('error', reject);
      
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize PayPal payment form
   */
  async initializePaymentForm() {
    try {
      // Show content, hide loading
      this.toggleLoadingState(false);

      if (!paypal.HostedFields.isEligible()) {
        this.displayHostedFieldsUnavailableMessage();
        return;
      }

      await this.renderHostedFields();
    } catch (error) {
      console.error('Failed to initialize payment form:', error);
      this.displayErrorAlert();
    }
  }

  /**
   * Render PayPal hosted fields
   */
  async renderHostedFields() {
    try {
      this.state.hostedFields = await paypal.HostedFields.render({
        createOrder: this.createOrder.bind(this),
        styles: this.getFieldStyles(),
        fields: this.getFieldConfiguration()
      });

      this.setupFormSubmission();
    } catch (error) {
      console.error('Failed to render hosted fields:', error);
      throw error;
    }
  }

  /**
   * Create order on server
   */
  async createOrder() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/create_order`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ intent: this.config.intent })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const order = await response.json();
      this.state.orderId = order.id;
      return order.id;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Get field styling configuration
   */
  getFieldStyles() {
    return {
      '.valid': { color: 'green' },
      '.invalid': { color: 'red' },
      'input': {
        'font-size': '16pt',
        'color': '#ffffff'
      }
    };
  }

  /**
   * Get field configuration
   */
  getFieldConfiguration() {
    return {
      number: {
        selector: "#card-number",
        placeholder: "4111 1111 1111 1111"
      },
      cvv: {
        selector: "#cvv",
        placeholder: "123"
      },
      expirationDate: {
        selector: "#expiration-date",
        placeholder: "MM/YY"
      }
    };
  }

  /**
   * Setup form submission handling
   */
  setupFormSubmission() {
    const form = document.querySelector("#card-form");
    
    if (!form) {
      console.error('Card form not found');
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.handleFormSubmission();
    });
  }

  /**
   * Handle form submission
   */
  async handleFormSubmission() {
    try {
      this.setSubmitButtonState(true, "Loading...");

      await this.state.hostedFields.submit(this.getCustomerData());
      await this.completeOrder();
    } catch (error) {
      console.error('Form submission failed:', error);
      this.resetSubmitButton();
      this.displayErrorAlert();
    }
  }

  /**
   * Get customer data for payment
   */
  getCustomerData() {
    return {
      cardholderName: "Raúl Uriarte, Jr.",
      billingAddress: {
        streetAddress: "123 Springfield Rd",
        extendedAddress: "",
        region: "AZ",
        locality: "CHANDLER",
        postalCode: "85224",
        countryCodeAlpha2: "US"
      }
    };
  }

  /**
   * Complete the order on server
   */
  async completeOrder() {
    try {
      const email = document.getElementById("email")?.value || "";
      
      const response = await fetch(`${this.config.apiBaseUrl}/complete_order`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          intent: this.config.intent,
          order_id: this.state.orderId,
          email: email
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const orderDetails = await response.json();
      this.displaySuccessMessage(orderDetails);
    } catch (error) {
      console.error('Failed to complete order:', error);
      throw error;
    }
  }

  /**
   * Toggle loading state
   */
  toggleLoadingState(isLoading) {
    const loadingElement = document.getElementById("loading");
    const contentElement = document.getElementById("content");

    if (loadingElement) {
      loadingElement.classList.toggle("hide", !isLoading);
    }
    
    if (contentElement) {
      contentElement.classList.toggle("hide", isLoading);
    }
  }

  /**
   * Set submit button state
   */
  setSubmitButtonState(disabled, text) {
    const submitButton = document.querySelector("#card-form input[type='submit']");
    
    if (!submitButton) return;

    if (disabled) {
      submitButton.setAttribute("disabled", "");
    } else {
      submitButton.removeAttribute("disabled");
    }
    
    submitButton.value = text;
  }

  /**
   * Reset submit button to default state
   */
  resetSubmitButton() {
    this.setSubmitButtonState(false, "Purchase");
  }

  /**
   * Display success message after payment
   */
  displaySuccessMessage(orderDetails) {
    console.log('Order completed successfully:', orderDetails);
    
    const intentObject = this.config.intent === "authorize" ? "authorizations" : "captures";
    const payment = orderDetails.purchase_units[0].payments[intentObject][0];
    
    const firstName = orderDetails?.payer?.name?.given_name || '';
    const lastName = orderDetails?.payer?.name?.surname || '';
    const amount = payment.amount.value;
    const currency = payment.amount.currency_code;

    const alertsContainer = document.getElementById("alerts");
    if (alertsContainer) {
      alertsContainer.innerHTML = `
        <div class='ms-alert ms-action'>
          Thank you ${firstName} ${lastName} for your payment of ${amount} ${currency}!
        </div>
      `;
    }

    // Hide the card form after successful payment
    const cardForm = document.getElementById("card-form");
    if (cardForm) {
      cardForm.classList.add("hide");
    }
  }

  /**
   * Display error alert
   */
  displayErrorAlert() {
    const alertsContainer = document.getElementById("alerts");
    if (alertsContainer) {
      alertsContainer.innerHTML = `
        <div class="ms-alert ms-action2 ms-small">
          <span class="ms-close"></span>
          <p>An Error Occurred! (View console for more info)</p>
        </div>
      `;
    }
  }

  /**
   * Display message when hosted fields are unavailable
   */
  displayHostedFieldsUnavailableMessage() {
    const alertsContainer = document.getElementById("alerts");
    if (alertsContainer) {
      alertsContainer.innerHTML = `
        <div class="ms-alert ms-action2 ms-small">
          <span class="ms-close"></span>
          <p>Card payment form is not available in this browser.</p>
        </div>
      `;
    }
  }
}

// Initialize PayPal integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PayPalIntegration();
});

// Fallback initialization if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PayPalIntegration();
  });
} else {
  new PayPalIntegration();
}