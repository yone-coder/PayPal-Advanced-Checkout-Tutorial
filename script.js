// Helper / Utility functions
let current_customer_id;
let order_id;

// Replace this URL with your actual Render.com backend URL
const API_BASE_URL = "https://paypal-with-nodejs.onrender.com";

let script_to_head = (attributes_object) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      for (const name of Object.keys(attributes_object)) {
        script.setAttribute(name, attributes_object[name]);
      }
      document.head.appendChild(script);
      script.addEventListener('load', resolve);
      script.addEventListener('error', reject);
    });
}

let reset_purchase_button = () => {
    document.querySelector("#card-form").querySelector("input[type='submit']").removeAttribute("disabled");
    document.querySelector("#card-form").querySelector("input[type='submit']").value = "Purchase";
}

const is_user_logged_in = () => {
  return new Promise((resolve) => {
    customer_id = localStorage.getItem("logged_in_user_id") || "";
    resolve();
  });
}

const get_client_token = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_client_token`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "customer_id": current_customer_id }),
      });

      const client_token = await response.text();
      resolve(client_token);
    } catch (error) {
      reject(error);
    }
  });
}

let handle_close = (event) => {
    event.target.closest(".ms-alert").remove();
}

let handle_click = (event) => {
    if (event.target.classList.contains("ms-close")) {
        handle_close(event);
    }
}

document.addEventListener("click", handle_click);

const paypal_sdk_url = "https://www.paypal.com/sdk/js";
const client_id = "AU23YbLMTqxG3iSvnhcWtix6rGN14uw3axYJgrDe8VqUVng8XiQmmeiaxJWbnpbZP_f4--RTg146F1Mj";
const currency = "USD";
const intent = "capture";

let display_error_alert = () => {
    document.getElementById("alerts").innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>An Error Ocurred! (View console for more info)</p>  </div>`;
}

let display_success_message = (order_details) => {
    console.log(order_details); //https://developer.paypal.com/docs/api/orders/v2/#orders_capture!c=201&path=create_time&t=response
    let intent_object = intent === "authorize" ? "authorizations" : "captures";
    //Custom Successful Message
    document.getElementById("alerts").innerHTML = `<div class='ms-alert ms-action'>Thank you ` + (order_details?.payer?.name?.given_name || ``) + ` ` + (order_details?.payer?.name?.surname || ``) + ` for your payment of ` + order_details.purchase_units[0].payments[intent_object][0].amount.value + ` ` + order_details.purchase_units[0].payments[intent_object][0].amount.currency_code + `!</div>`;

    //Hide the card form after successful payment
    document.getElementById("card-form").classList.add("hide");
}

//PayPal Code - Forms Only
is_user_logged_in()
.then(() => {
    return get_client_token();
})
.then((client_token) => {
    //https://developer.paypal.com/sdk/js/configuration/#link-queryparameters
    return script_to_head({"src": paypal_sdk_url + "?client-id=" + client_id + "&enable-funding=venmo&currency=" + currency + "&intent=" + intent + "&components=hosted-fields", "data-client-token": client_token}) //https://developer.paypal.com/sdk/js/configuration/#link-configureandcustomizeyourintegration
})
.then(() => {
    //Handle loading spinner
    document.getElementById("loading").classList.add("hide");
    document.getElementById("content").classList.remove("hide");

    //Hosted Fields Only
    if (paypal.HostedFields.isEligible()) {
        // Renders card fields
        paypal_hosted_fields = paypal.HostedFields.render({
          // Call your server to set up the transaction
          createOrder: () => {
            return fetch(`${API_BASE_URL}/create_order`, {
                method: "post", 
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ "intent": intent })
            })
            .then((response) => response.json())
            .then((order) => { order_id = order.id; return order.id; });
          },
          styles: {
            '.valid': {
              color: 'green'
            },
            '.invalid': {
              color: 'red'
            },
            'input': {
                'font-size': '16pt',
                'color': '#ffffff'
            },
          },
          fields: {
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
          }
        }).then((card_fields) => {
         document.querySelector("#card-form").addEventListener("submit", (event) => {
            event.preventDefault();
            document.querySelector("#card-form").querySelector("input[type='submit']").setAttribute("disabled", "");
            document.querySelector("#card-form").querySelector("input[type='submit']").value = "Loading...";
            card_fields
              .submit(
                //Customer Data BEGIN
                //This wasn't part of the video guide originally, but I've included it here
                //So you can reference how you could send customer data, which may
                //be a requirement of your project to pass this info to card issuers
                {
                  // Cardholder's first and last name
                  cardholderName: "Raúl Uriarte, Jr.",
                  // Billing Address
                  billingAddress: {
                    // Street address, line 1
                    streetAddress: "123 Springfield Rd",
                    // Street address, line 2 (Ex: Unit, Apartment, etc.)
                    extendedAddress: "",
                    // State
                    region: "AZ",
                    // City
                    locality: "CHANDLER",
                    // Postal Code
                    postalCode: "85224",
                    // Country Code
                    countryCodeAlpha2: "US",
                  },
                }
                //Customer Data END
              )
              .then(() => {
                return fetch(`${API_BASE_URL}/complete_order`, {
                    method: "post", 
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                    body: JSON.stringify({
                        "intent": intent,
                        "order_id": order_id,
                        "email": document.getElementById("email").value
                    })
                })
                .then((response) => response.json())
                .then((order_details) => {
                    display_success_message(order_details);
                 })
                 .catch((error) => {
                    console.log(error);
                    display_error_alert();
                 });
              })
              .catch((err) => {
                console.log(err);
                reset_purchase_button();
                display_error_alert();
              });
          });
        });
      } else {
        // Show message if hosted fields are not available
        document.getElementById("alerts").innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>Card payment form is not available in this browser.</p></div>`;
      }
})
.catch((error) => {
    reset_purchase_button();
    display_error_alert();
});