import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();

// CORS middleware - Add this BEFORE other middleware
app.use((req, res, next) => {
    // Allow requests from any origin (you can restrict this to specific domains)
    res.header('Access-Control-Allow-Origin', '*');

    // If you want to restrict to specific domains, use this instead:
    // const allowedOrigins = ['https://yourdomain.com', 'https://anotherdomain.com'];
    // const origin = req.headers.origin;
    // if (allowedOrigins.includes(origin)) {
    //     res.header('Access-Control-Allow-Origin', origin);
    // }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const port = process.env.PORT || 3000;
const environment = process.env.ENVIRONMENT || 'sandbox';
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const endpoint_url = environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

// Price configuration - This could eventually be moved to a database
// Think of this as your "price catalog" that defines what you're selling
const PRICING_CONFIG = {
    nft: {
        value: '5500.00',      // The raw numeric value PayPal needs
        currency: 'USD',        // Currency code
        display: '$5,500.00',   // Human-readable format for your frontend
        description: 'Premium NFT Collection'
    }
    // You could add more products here:
    // premium_nft: { value: '10000.00', currency: 'USD', display: '$10,000.00' }
};

/**
 * NEW ENDPOINT: Get current pricing information
 * This allows your frontend to fetch the current price dynamically
 * Instead of hardcoding prices in your frontend, you fetch them fresh each time
 */
app.get('/get_price/:product?', (req, res) => {
    try {
        // Default to 'nft' if no specific product is requested
        const productType = req.params.product || 'nft';
        
        // Look up the product in our pricing configuration
        const pricing = PRICING_CONFIG[productType];
        
        if (!pricing) {
            // If someone requests a product that doesn't exist, return an error
            return res.status(404).json({
                error: 'Product not found',
                available_products: Object.keys(PRICING_CONFIG)
            });
        }
        
        // Return the pricing information
        // This gives your frontend everything it needs to display the price
        res.json({
            product: productType,
            price: pricing.value,
            currency: pricing.currency,
            display: pricing.display,
            description: pricing.description,
            // You might also want to include tax information, discounts, etc.
            timestamp: new Date().toISOString() // When this price was fetched
        });
    } catch (error) {
        console.error('Error fetching price:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * UPDATED: Creates an order with dynamic pricing
 * Now the price comes from our centralized configuration instead of being hardcoded
 */
app.post('/create_order', (req, res) => {
    get_access_token()
        .then(access_token => {
            // Extract product type from request, default to 'nft'
            const productType = req.body.product || 'nft';
            
            // Get the pricing information from our configuration
            const pricing = PRICING_CONFIG[productType];
            
            if (!pricing) {
                throw new Error(`Invalid product type: ${productType}`);
            }
            
            // Build the order data using our pricing configuration
            // This ensures consistency between what the user sees and what gets charged
            let order_data_json = {
                'intent': req.body.intent.toUpperCase(),
                'purchase_units': [{
                    'amount': {
                        'currency_code': pricing.currency,
                        'value': pricing.value  // Now using our centralized pricing
                    },
                    // Optional: Add more details about what's being purchased
                    'description': pricing.description
                }]
            };
            
            const data = JSON.stringify(order_data_json);

            return fetch(endpoint_url + '/v2/checkout/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
                body: data
            });
        })
        .then(res => res.json())
        .then(json => {
            res.send(json);
        })
        .catch(err => {
            console.error('Error creating order:', err);
            res.status(500).send({
                error: 'Failed to create order',
                message: err.message
            });
        });
});

/**
 * OPTIONAL: Add a price update endpoint for administrative purposes
 * This would allow you to update prices without restarting your server
 * In production, you'd want to add authentication to this endpoint
 */
app.post('/update_price', (req, res) => {
    try {
        const { product, value, display, description } = req.body;
        
        if (!product || !value) {
            return res.status(400).json({
                error: 'Product and value are required'
            });
        }
        
        // Validate that the value is a valid price format
        if (!/^\d+\.\d{2}$/.test(value)) {
            return res.status(400).json({
                error: 'Price must be in format XX.XX (e.g., 5500.00)'
            });
        }
        
        // Update the pricing configuration
        PRICING_CONFIG[product] = {
            value: value,
            currency: 'USD', // You could make this configurable too
            display: display || `$${value}`,
            description: description || PRICING_CONFIG[product]?.description || 'Product'
        };
        
        res.json({
            message: `Price updated for ${product}`,
            new_pricing: PRICING_CONFIG[product]
        });
        
    } catch (error) {
        console.error('Error updating price:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Completes an order and returns it as a JSON response.
 */
app.post('/complete_order', (req, res) => {
    get_access_token()
        .then(access_token => {
            fetch(endpoint_url + '/v2/checkout/orders/' + req.body.order_id + '/' + req.body.intent, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    }
                })
                .then(res => res.json())
                .then(json => {
                    console.log(json);
                    if (json.id) {
                      send_email_receipt({"id": json.id, "email": req.body.email});
                    }
                    res.send(json);
                })
        })
        .catch(err => {
            console.log(err);
            res.status(500).send(err)
        })
});

/**
 * Retrieves a client token and returns it as a JSON response.
 */
app.post("/get_client_token", (req, res) => {
    get_access_token()
      .then((access_token) => {
        const payload = req.body.customer_id
          ? JSON.stringify({ customer_id: req.body.customer_id })
          : null;

        fetch(endpoint_url + "/v1/identity/generate-token", {
          method: "post",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: payload,
        })
          .then((response) => response.json())
          .then((data) => res.send(data.client_token));
      })
      .catch((error) => {
        console.error("Error:", error);
        res.status(500).send("An error occurred while processing the request.");
      });
});

// Static file serving (only needed if hosting HTML from same server)
app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/index.html');
});
app.get('/style.css', (req, res) => {
    res.sendFile(process.cwd() + '/style.css');
});
app.get('/script.js', (req, res) => {
    res.sendFile(process.cwd() + '/script.js');
});

// Email function (unchanged)
function send_email_receipt(object) {
  const sendgrid_api_key = 'REPLACE_WITH_SENDGRID_API_KEY';
  let html_email_content = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"> <!--[if !mso]><!--> <meta http-equiv="X-UA-Compatible" content="IE=Edge"> <!--<![endif]--> <!--[if (gte mso 9)|(IE)]> <xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> <![endif]--> <!--[if (gte mso 9)|(IE)]> <style type="text/css"> body {width: 600px;margin: 0 auto;} table {border-collapse: collapse;} table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;} img {-ms-interpolation-mode: bicubic;} </style><![endif]--> <style type="text/css"> body, p, div { font-family: inherit; font-size: 14px; } body { color: #000000; } body a { color: #000000; text-decoration: none; } p { margin: 0; padding: 0; } table.wrapper { width:100% !important; table-layout: fixed; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -moz-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } img.max-width { max-width: 100% !important; } .column.of-2 { width: 50%; } .column.of-3 { width: 33.333%; } .column.of-4 { width: 25%; } ul ul ul ul { list-style-type: disc !important; } ol ol { list-style-type: lower-roman !important; } ol ol ol { list-style-type: lower-latin !important; } ol ol ol ol { list-style-type: decimal !important; } @media screen and (max-width:480px) { .preheader .rightColumnContent, .footer .rightColumnContent { text-align: left !important; } .preheader .rightColumnContent div, .preheader .rightColumnContent span, .footer .rightColumnContent div, .footer .rightColumnContent span { text-align: left !important; } .preheader .rightColumnContent, .preheader .leftColumnContent { font-size: 80% !important; padding: 5px 0; } table.wrapper-mobile { width: 100% !important; table-layout: fixed; } img.max-width { height: auto !important; max-width: 100% !important; } a.bulletproof-button { display: block !important; width: auto !important; font-size: 80%; padding-left: 0 !important; padding-right: 0 !important; } .columns { width: 100% !important; } .column { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-left: 0 !important; margin-right: 0 !important; } .social-icon-column { display: inline-block !important; } } </style> <style> @media screen and (max-width:480px) { table { width: 480px !important; } } </style> <!--user entered Head Start--><link href="https://fonts.googleapis.com/css?family=Viga&display=swap" rel="stylesheet"><style> body {font-family: 'Viga', sans-serif;}</style><!--End Head user entered--> </head> <body> <center class="wrapper" data-link-color="#000000" data-body-style="font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;"> <div class="webkit"> <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF"> <tr> <td valign="top" bgcolor="#FFFFFF" width="100%"> <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0"> <tr> <td width="100%"> <table width="100%" cellpadding="0" cellspacing="0" border="0"> <tr> <td> <!--[if mso]> <center> <table><tr><td width="600"> <![endif]--> <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center"> <tr> <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;"> <tr> <td role="module-content"> <p></p> </td> </tr> </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="2f94ef24-a0d9-4e6f-be94-d2d1257946b0" data-mc-module-version="2019-10-22"> <tbody> <tr> <td style="padding:18px 50px 18px 50px; line-height:22px; text-align:inherit; background-color:#dde6de;" height="100%" valign="top" bgcolor="#dde6de" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="font-size: 16px; font-family: inherit">Thank you for purchasing the NFT! Your transaction ID is: ${object.id}. We appreciate your patronage</span></div><div></div></div></td> </tr> </tbody> </table><table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed;" width="100%" data-muid="c7bd4768-c1ab-4c64-ba24-75a9fd6daed8"> <tbody> <tr> <td align="center" bgcolor="#dde6de" class="outer-td" style="padding:10px 0px 20px 0px; background-color:#dde6de;"> <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align:center;"> <tbody> <tr> <td align="center" bgcolor="#eac96c" class="inner-td" style="border-radius:6px; font-size:16px; text-align:center; background-color:inherit;"> <a href="#" style="background-color:#eac96c; border:0px solid #333333; border-color:#333333; border-radius:0px; border-width:0px; color:#000000; display:inline-block; font-size:16px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:20px 30px 20px 30px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;" target="_blank">Download NFT</a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:30px 0px 0px 0px;" bgcolor="#dde6de" data-distribution="1"> <tbody> <tr role="module-content"> <td height="100%" valign="top"><table width="600" style="width:600px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0"> <tbody> <tr> <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="ce6dd3be-5ed4-42d2-b304-55a58022cdf0"> <tbody> <tr> <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center"> <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:100% !important; width:100%; height:auto !important;" width="600" alt="" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/cf27a5b92c1e6a73/19b5925f-1f96-4a8d-ad51-e591149f912c/1024x1024.png"> </td> </tr> </tbody> </table></td> </tr> </tbody> </table></td> </tr> </tbody> </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="30d9a68c-ce13-4754-a845-6c3dc22721ee" data-mc-module-version="2019-10-22"> <tbody> <tr> <td style="padding:40px 40px 40px 40px; line-height:22px; text-align:inherit; background-color:#fe737c;" height="100%" valign="top" bgcolor="#fe737c" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 16px">Need more help figuring things out? Our support team is here to help!</span></div><div style="font-family: inherit; text-align: center"><br></div><div style="font-family: inherit; text-align: center"><a href="#"><span style="color: #ffffff; font-size: 16px"><u>Help Center</u></span></a></div><div></div></div></td> </tr> </tbody> </table></td> </tr> </table> <!--[if mso]> </td> </tr> </table> </center> <![endif]--> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table> </div> </center> </body> </html>`;

  const sendgrid_options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
      'Authorization': `Bearer ${sendgrid_api_key}`},
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: object.email }],
        subject: 'Thank you for purchasing our NFT!',
      }],
      from: { email: 'mycompany@email.com' },
      content: [
        {
          type: 'text/html',
          value: html_email_content,
        },
      ],
    }),
  };

  fetch('https://api.sendgrid.com/v3/mail/send', sendgrid_options)
  .then(response => {
    console.log(response);
    if (response.ok) {
      console.log('Email sent successfully');
    } else {
      console.error('Error sending email:', response.statusText);
    }
  })
  .catch(error => {
    console.error('Error sending email:', error.message);
  });
}

function get_access_token() {
    const auth = `${client_id}:${client_secret}`
    const data = 'grant_type=client_credentials'
    return fetch(endpoint_url + '/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
            },
            body: data
        })
        .then(res => res.json())
        .then(json => {
            return json.access_token;
        })
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})