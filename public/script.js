/**
 * PayPal Payment Integration with Enhanced Visual Styling
 * Sophisticated UI with animations and modern design
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

    // Inject enhanced styles
    this.injectEnhancedStyles();
    
    // Initialize the integration
    this.initialize();
  }

  /**
   * Inject sophisticated CSS styles
   */
  injectEnhancedStyles() {
    const styles = `
      <style>
        /* Enhanced Alert Styles with Animations */
        .ms-alert {
          position: relative;
          padding: 20px 25px;
          margin: 15px 0;
          border-radius: 12px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-weight: 500;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideInDown 0.5s ease-out;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .ms-alert::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          animation: progressBar 3s ease-in-out;
        }

        .ms-alert:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        /* Success Alert */
        .ms-alert.ms-action {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: relative;
        }

        .ms-alert.ms-action::after {
          content: '✓';
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 24px;
          font-weight: bold;
          opacity: 0.8;
          animation: checkmark 0.8s ease-out 0.3s both;
        }

        /* Error Alert */
        .ms-alert.ms-action2 {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
        }

        .ms-alert.ms-action2::after {
          content: '⚠';
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          animation: shake 0.5s ease-in-out;
        }

        /* Close Button Enhancement */
        .ms-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }

        .ms-close::before {
          content: '×';
          color: white;
          line-height: 1;
        }

        .ms-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg) scale(1.1);
        }

        /* Loading Enhancement */
        #loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 40px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(102, 126, 234, 0.1);
          border-left: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        .loading-text {
          color: #667eea;
          font-family: 'Segoe UI', sans-serif;
          font-weight: 500;
          animation: pulse 2s ease-in-out infinite;
        }

        /* Card Form Enhancement */
        #card-form {
          background: linear-gradient(145deg, #f8f9ff 0%, #e8eeff 100%);
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        #card-form::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }

        #card-form:hover {
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.15);
          transform: translateY(-2px);
        }

        /* Enhanced Input Fields */
        .paypal-card-field {
          background: white;
          border: 2px solid #e1e8f0;
          border-radius: 10px;
          padding: 15px;
          margin: 10px 0;
          transition: all 0.3s ease;
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .paypal-card-field:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        /* Submit Button Enhancement */
        #card-form input[type='submit'] {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 1px;
          min-width: 160px;
        }

        #card-form input[type='submit']:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        #card-form input[type='submit']:active {
          transform: translateY(0);
        }

        #card-form input[type='submit']:disabled {
          background: linear-gradient(135deg, #a0a0a0 0%, #808080 100%);
          cursor: not-allowed;
          animation: pulse 1.5s ease-in-out infinite;
        }

        #card-form input[type='submit']::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          transition: left 0.5s ease;
        }

        #card-form input[type='submit']:hover::before {
          left: 100%;
        }

        /* Hide/Show Animation */
        .hide {
          opacity: 0;
          transform: translateY(-20px);
          pointer-events: none;
          transition: all 0.4s ease;
        }

        .show {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.4s ease;
        }

        /* Keyframe Animations */
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes checkmark {
          0% {
            opacity: 0;
            transform: translateY(-50%) scale(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-50%) scale(1.2);
          }
          100% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          25% { transform: translateY(-50%) translateX(-5px); }
          75% { transform: translateY(-50%) translateX(5px); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes progressBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .ms-alert {
            margin: 10px;
            padding: 15px 20px;
          }
          
          #card-form {
            margin: 10px;
            padding: 20px;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
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
   * Set up global event listeners with enhanced interactions
   */
  setupEventListeners() {
    document.addEventListener("click", (event) => {
      if (event.target.classList.contains("ms-close")) {
        this.handleAlertClose(event);
      }
    });

    // Add ripple effect to buttons
    document.addEventListener("click", (event) => {
      if (event.target.type === 'submit') {
        this.createRippleEffect(event);
      }
    });
  }

  /**
   * Create ripple effect for button clicks
   */
  createRippleEffect(event) {
    const button = event.target;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Enhanced alert close with animation
   */
  handleAlertClose(event) {
    const alertElement = event.target.closest(".ms-alert");
    if (alertElement) {
      alertElement.style.animation = 'slideInDown 0.3s ease-in reverse';
      setTimeout(() => {
        alertElement.remove();
      }, 300);
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
   * Initialize PayPal payment form with enhanced loading
   */
  async initializePaymentForm() {
    try {
      // Enhanced loading display
      this.showEnhancedLoading();
      
      // Show content, hide loading with animation
      setTimeout(() => {
        this.toggleLoadingState(false);
      }, 1000); // Minimum loading time for better UX

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
   * Show enhanced loading animation
   */
  showEnhancedLoading() {
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Initializing secure payment...</div>
      `;
    }
  }

  /**
   * Render PayPal hosted fields with enhanced styling
   */
  async renderHostedFields() {
    try {
      this.state.hostedFields = await paypal.HostedFields.render({
        createOrder: this.createOrder.bind(this),
        styles: this.getEnhancedFieldStyles(),
        fields: this.getFieldConfiguration()
      });

      this.enhanceFieldContainers();
      this.setupFormSubmission();
    } catch (error) {
      console.error('Failed to render hosted fields:', error);
      throw error;
    }
  }

  /**
   * Enhance field containers with CSS classes
   */
  enhanceFieldContainers() {
    const fieldSelectors = ['#card-number', '#cvv', '#expiration-date'];
    fieldSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add('paypal-card-field');
      }
    });
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
   * Get enhanced field styling configuration
   */
  getEnhancedFieldStyles() {
    return {
      '.valid': {
        color: '#28a745',
        'font-weight': '500'
      },
      '.invalid': {
        color: '#dc3545',
        'font-weight': '500'
      },
      'input': {
        'font-size': '16px',
        'color': '#2c3e50',
        'font-family': '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        'font-weight': '500',
        'padding': '12px',
        'border': 'none',
        'outline': 'none',
        'background': 'transparent'
      },
      'input:focus': {
        'color': '#667eea'
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
   * Handle form submission with enhanced feedback
   */
  async handleFormSubmission() {
    try {
      this.setSubmitButtonState(true, "Processing...");

      await this.state.hostedFields.submit(this.getCustomerData());
      
      this.setSubmitButtonState(true, "Completing...");
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
   * Toggle loading state with smooth animations
   */
  toggleLoadingState(isLoading) {
    const loadingElement = document.getElementById("loading");
    const contentElement = document.getElementById("content");

    if (loadingElement && contentElement) {
      if (isLoading) {
        loadingElement.classList.remove("hide");
        contentElement.classList.add("hide");
      } else {
        loadingElement.classList.add("hide");
        contentElement.classList.remove("hide");
        contentElement.classList.add("show");
      }
    }
  }

  /**
   * Set submit button state with enhanced styling
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
   * Display enhanced success message with celebration animation
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
          <strong>Payment Successful!</strong><br>
          Thank you ${firstName} ${lastName} for your payment of ${amount} ${currency}!
          <p style="margin-top: 10px; opacity: 0.9; font-size: 14px;">
            🎉 Your transaction has been processed successfully
          </p>
        </div>
      `;
    }

    // Hide the card form with animation
    const cardForm = document.getElementById("card-form");
    if (cardForm) {
      cardForm.style.transition = 'all 0.5s ease';
      cardForm.style.transform = 'translateY(-20px)';
      cardForm.style.opacity = '0';
      setTimeout(() => {
        cardForm.classList.add("hide");
      }, 500);
    }

    // Add confetti effect
    this.createConfettiEffect();
  }

  /**
   * Create confetti celebration effect
   */
  createConfettiEffect() {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}vw;
          top: -10px;
          border-radius: 50%;
          animation: confetti 3s ease-out forwards;
          pointer-events: none;
          z-index: 1000;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.remove();
        }, 3000);
      }, i * 100);
    }

    // Add confetti animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti {
        to {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Display enhanced error alert
   */
  displayErrorAlert() {
    const alertsContainer = document.getElementById("alerts");
    if (alertsContainer) {
      alertsContainer.innerHTML = `
        <div class="ms-alert ms-action2 ms-small">
          <span class="ms-close"></span>
          <strong>Oops! Something went wrong</strong>
          <p style="margin-top: 8px; font-size: 14px; opacity: 0.9;">
            Please check your connection and try again. View console for details.
          </p>
        </div>
      `;
    }
  }

  /**
   * Display enhanced unavailable message
   */
  displayHostedFieldsUnavailableMessage() {
    const alertsContainer = document.getElementById("alerts");
    if (alertsContainer) {
      alertsContainer.innerHTML = `
        <div class="ms-alert ms-action2 ms-small">
          <span class="ms-close"></span>
          <strong>Browser Compatibility Issue</strong>
          <p style="margin-top: 8px; font-size: 14px; opacity: 0.9;">
            Card payment form is not available in this browser. Please try a different browser.
          </p>
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