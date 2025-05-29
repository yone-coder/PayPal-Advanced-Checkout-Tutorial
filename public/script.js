/**
 * PayPal Integration Manager
 * Sophisticated payment processing with hosted fields integration
 */

class PayPalIntegrationManager {
  constructor() {
    this.config = {
      apiBaseUrl: "https://paypal-with-nodejs.onrender.com",
      paypalSdkUrl: "https://www.paypal.com/sdk/js",
      clientId: "AU23YbLMTqxG3iSvnhcWtix6rGN14uw3axYJgrDe8VqUVng8XiQmmeiaxJWbnpbZP_f4--RTg146F1Mj",
      currency: "USD",
      intent: "capture"
    };

    this.state = {
      currentCustomerId: null,
      orderId: null,
      hostedFields: null,
      isProcessing: false
    };

    this.elements = {
      loading: document.getElementById("loading"),
      content: document.getElementById("content"),
      alerts: document.getElementById("alerts"),
      cardForm: document.getElementById("card-form"),
      submitButton: null // Will be set after form is found
    };

    this.init();
  }

  /**
   * Initialize the PayPal integration
   */
  async init() {
    try {
      await this.setupEventListeners();
      await this.authenticateUser();
      const clientToken = await this.getClientToken();
      await this.loadPayPalSDK(clientToken);
      await this.setupHostedFields();
      this.showContent();
    } catch (error) {
      console.error('PayPal Integration initialization failed:', error);
      this.displayErrorAlert('Failed to initialize payment system');
    }
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    return new Promise((resolve) => {
      document.addEventListener("click", this.handleGlobalClick.bind(this));
      resolve();
    });
  }

  /**
   * Handle global click events (alert close buttons)
   */
  handleGlobalClick(event) {
    if (event.target.classList.contains("ms-close")) {
      this.closeAlert(event);
    }
  }

  /**
   * Close alert dialog
   */
  closeAlert(event) {
    const alert = event.target.closest(".ms-alert");
    if (alert) {
      alert.remove();
    }
  }

  /**
   * Check if user is logged in
   */
  authenticateUser() {
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
        headers: { 
          "Content-Type": "application/json",
          "Accept": "text/plain"
        },
        body: JSON.stringify({ 
          customer_id: this.state.currentCustomerId 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Failed to get client token:', error);
      throw new Error('Unable to authenticate with payment provider');
    }
  }

  /**
   * Dynamically load PayPal SDK script
   */
  loadPayPalSDK(clientToken) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      
      const sdkParams = new URLSearchParams({
        'client-id': this.config.clientId,
        'enable-funding': 'venmo',
        'currency': this.config.currency,
        'intent': this.config.intent,
        'components': 'hosted-fields'
      });

      script.src = `${this.config.paypalSdkUrl}?${sdkParams.toString()}`;
      script.setAttribute('data-client-token', clientToken);
      
      script.addEventListener('load', resolve);
      script.addEventListener('error', () => {
        reject(new Error('Failed to load PayPal SDK'));
      });
      
      document.head.appendChild(script);
    });
  }

  /**
   * Setup PayPal hosted fields
   */
  async setupHostedFields() {
    if (!paypal?.HostedFields?.isEligible()) {
      throw new Error('Hosted fields not available in this browser');
    }

    try {
      this.state.hostedFields = await paypal.HostedFields.render({
        createOrder: this.createOrder.bind(this),
        styles: this.getFieldStyles(),
        fields: this.getFieldConfiguration()
      });

      this.setupFormSubmission();
    } catch (error) {
      console.error('Failed to setup hosted fields:', error);
      throw new Error('Payment form initialization failed');
    }
  }

  /**
   * Get styling configuration for hosted fields
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
   * Get field configuration for hosted fields
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
   * Create order on server
   */
  async createOrder() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/create_order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json; charset=utf-8" 
        },
        body: JSON.stringify({ 
          intent: this.config.intent 
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.status}`);
      }

      const order = await response.json();
      this.state.orderId = order.id;
      return order.id;
    } catch (error) {
      console.error('Order creation failed:', error);
      throw error;
    }
  }

  /**
   * Setup form submission handling
   */
  setupFormSubmission() {
    if (!this.elements.cardForm) {
      throw new Error('Card form not found');
    }

    this.elements.submitButton = this.elements.cardForm.querySelector("input[type='submit']");
    
    this.elements.cardForm.addEventListener("submit", this.handleFormSubmit.bind(this));
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    
    if (this.state.isProcessing) {
      return;
    }

    try {
      this.setProcessingState(true);
      await this.processPayment();
    } catch (error) {
      console.error('Payment processing failed:', error);
      this.displayErrorAlert('Payment processing failed. Please try again.');
    } finally {
      this.setProcessingState(false);
    }
  }

  /**
   * Process the payment
   */
  async processPayment() {
    const customerData = this.getCustomerData();
    
    await this.state.hostedFields.submit(customerData);
    
    const orderDetails = await this.completeOrder();
    this.displaySuccessMessage(orderDetails);
  }

  /**
   * Get customer data for payment processing
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
        countryCodeAlpha2: "US",
      },
    };
  }

  /**
   * Complete the order on server
   */
  async completeOrder() {
    const emailElement = document.getElementById("email");
    
    const response = await fetch(`${this.config.apiBaseUrl}/complete_order`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json; charset=utf-8" 
      },
      body: JSON.stringify({
        intent: this.config.intent,
        order_id: this.state.orderId,
        email: emailElement?.value || ""
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to complete order: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Set processing state and update UI
   */
  setProcessingState(isProcessing) {
    this.state.isProcessing = isProcessing;
    
    if (this.elements.submitButton) {
      if (isProcessing) {
        this.elements.submitButton.setAttribute("disabled", "");
        this.elements.submitButton.value = "Processing...";
      } else {
        this.elements.submitButton.removeAttribute("disabled");
        this.elements.submitButton.value = "Purchase";
      }
    }
  }

  /**
   * Display success message
   */
  displaySuccessMessage(orderDetails) {
    console.log('Order completed successfully:', orderDetails);
    
    const intentObject = this.config.intent === "authorize" ? "authorizations" : "captures";
    const payment = orderDetails.purchase_units[0].payments[intentObject][0];
    const payer = orderDetails.payer;
    
    const firstName = payer?.name?.given_name || '';
    const lastName = payer?.name?.surname || '';
    const amount = payment.amount.value;
    const currency = payment.amount.currency_code;
    
    const message = `Thank you ${firstName} ${lastName} for your payment of ${amount} ${currency}!`;
    
    this.elements.alerts.innerHTML = `
      <div class='ms-alert ms-action'>
        ${message}
      </div>
    `;

    // Hide the card form after successful payment
    this.elements.cardForm.classList.add("hide");
  }

  /**
   * Display error alert
   */
  displayErrorAlert(message = "An error occurred! (View console for more info)") {
    this.elements.alerts.innerHTML = `
      <div class="ms-alert ms-action2 ms-small">
        <span class="ms-close"></span>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Show main content and hide loading spinner
   */
  showContent() {
    if (this.elements.loading) {
      this.elements.loading.classList.add("hide");
    }
    if (this.elements.content) {
      this.elements.content.classList.remove("hide");
    }
  }
}

/**
 * Initialize PayPal integration when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    new PayPalIntegrationManager();
  } catch (error) {
    console.error('Failed to initialize PayPal integration:', error);
  }
});

// Fallback initialization if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, event listener will handle initialization
} else {
  // DOM is already loaded
  try {
    new PayPalIntegrationManager();
  } catch (error) {
    console.error('Failed to initialize PayPal integration:', error);
  }
}