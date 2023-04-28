import { got } from 'got'
import fetch from 'node-fetch'



fetch('https://api-m.sandbox.paypal.com/v2/invoicing/invoices', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer zekwhYgsYYI0zDg0p_Nf5v78VelCfYR0',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({
    "detail": {
      "invoice_number": "#123",
      "reference": "deal-ref",
      "invoice_date": "2018-11-12",
      "currency_code": "USD",
      "note": "Thank you for your business.",
      "term": "No refunds after 30 days.",
      "memo": "This is a long contract",
      "payment_term": {
        "term_type": "NET_10",
        "due_date": "2018-11-22"
      }
    },
    "invoicer": {
      "name": {
        "given_name": "David",
        "surname": "Larusso"
      },
      "address": {
        "address_line_1": "1234 First Street",
        "address_line_2": "337673 Hillside Court",
        "admin_area_2": "Anytown",
        "admin_area_1": "CA",
        "postal_code": "98765",
        "country_code": "US"
      },
      "email_address": "merchant@example.com",
      "phones": [{
        "country_code": "001",
        "national_number": "4085551234",
        "phone_type": "MOBILE"
      }],
      "website": "www.test.com",
      "tax_id": "ABcNkWSfb5ICTt73nD3QON1fnnpgNKBy- Jb5SeuGj185MNNw6g",
      "logo_url": "https://example.com/logo.PNG",
      "additional_notes": "2-4"
    },
    "primary_recipients": [{
      "billing_info": {
        "name": {
          "given_name": "Stephanie",
          "surname": "Meyers"
        },
        "address": {
          "address_line_1": "1234 Main Street",
          "admin_area_2": "Anytown",
          "admin_area_1": "CA",
          "postal_code": "98765",
          "country_code": "US"
        },
        "email_address": "bill-me@example.com",
        "phones": [{
          "country_code": "001",
          "national_number": "4884551234",
          "phone_type": "HOME"
        }],
        "additional_info_value": "add-info"
      },
      "shipping_info": {
        "name": {
          "given_name": "Stephanie",
          "surname": "Meyers"
        },
        "address": {
          "address_line_1": "1234 Main Street",
          "admin_area_2": "Anytown",
          "admin_area_1": "CA",
          "postal_code": "98765",
          "country_code": "US"
        }
      }
    }],
    "items": [{
      "name": "Yoga Mat",
      "description": "Elastic mat to practice yoga.",
      "quantity": "1",
      "unit_amount": {
        "currency_code": "USD",
        "value": "50.00"
      },
      "tax": {
        "name": "Sales Tax",
        "percent": "7.25"
      },
      "discount": {
        "percent": "5"
      },
      "unit_of_measure": "QUANTITY"
    }, {
      "name": "Yoga t-shirt",
      "quantity": "1",
      "unit_amount": {
        "currency_code": "USD",
        "value": "10.00"
      },
      "tax": {
        "name": "Sales Tax",
        "percent": "7.25"
      },
      "discount": {
        "amount": {
          "currency_code": "USD",
          "value": "5.00"
        }
      },
      "unit_of_measure": "QUANTITY"
    }],
    "configuration": {
      "partial_payment": {
        "allow_partial_payment": true,
        "minimum_amount_due": {
          "currency_code": "USD",
          "value": "20.00"
        }
      },
      "allow_tip": true,
      "tax_calculated_after_discount": true,
      "tax_inclusive": false,
      "template_id": "TEMP-19V05281TU309413B"
    },
    "amount": {
      "breakdown": {
        "custom": {
          "label": "Packing Charges",
          "amount": {
            "currency_code": "USD",
            "value": "10.00"
          }
        },
        "shipping": {
          "amount": {
            "currency_code": "USD",
            "value": "10.00"
          },
          "tax": {
            "name": "Sales Tax",
            "percent": "7.25"
          }
        },
        "discount": {
          "invoice_discount": {
            "percent": "5"
          }
        }
      }
    }
  })
});



/**
 * createInvoice
 * 
 *   * [ ] get Offer
 *   * [ ] create paypal invoice
 *   * [ ] add paypal data to Offer
 *   * [ ] 
 * 
 * 
 */ 
export async function createInvoice(appContext, offerId, priceCents, ch, bidder) {
  if (!appContext) throw new Error('appContext missing');
  if (!offerId) throw new Error('offerId missing');
  if (!priceCents) throw new priceCents('endPrice missing');
  if (!ch) throw new Error('ch missing');
  if (!bidder) throw new Error('bidder missing');

  console.log(`>>> creating invoice for offer ${offerId}`)
  try {

    const { data: offer } = await got.get(`${appContext.env.BACKEND_URL}/api/offers/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
      }
    }).json()

    const { data: paypalTokens }  = await got.get(`${appContext.env.BACKEND_URL}/api/bot-paypal-token`, {
      headers: {
        'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
      }
    }).json()

    console.log(offer)
    console.log(`paypal access token:${paypalTokens.attributes.accessToken}, item title:${offer.attributes.title}`)


    const paypalInvoiceResponse = await fetch(`${appContext.env.PAYPAL_URL}/v2/invoicing/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paypalTokens.attributes.accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          invoicer: {
            email_address: 'chris@grimtech.net'
          },
          detail: {
            currency_code: 'USD',
            invoice_number: `${ch}_${offerId}`
          },
          amount: {
            currency_code: 'USD',
            value: endPrice
          },
          items: [
            { 
              name: offer.attributes.title,
              quantity: 1,
              unit_amount: {
                currency_code: 'USD',
                value: endPrice
              }
            }
          ],
          configuration: {
            "partial_payment": {
              "allow_partial_payment": false,
            },
            "allow_tip": true,
          }
        })
        // body: JSON.stringify({ "detail": { "invoice_number": "#123", "reference": "deal-ref", "invoice_date": "2018-11-12", "currency_code": "USD", "note": "Thank you for your business.", "term": "No refunds after 30 days.", "memo": "This is a long contract", "payment_term": { "term_type": "NET_10", "due_date": "2018-11-22" } }, "invoicer": { "name": { "given_name": "David", "surname": "Larusso" }, "address": { "address_line_1": "1234 First Street", "address_line_2": "337673 Hillside Court", "admin_area_2": "Anytown", "admin_area_1": "CA", "postal_code": "98765", "country_code": "US" }, "email_address": "merchant@example.com", "phones": [ { "country_code": "001", "national_number": "4085551234", "phone_type": "MOBILE" } ], "website": "www.test.com", "tax_id": "ABcNkWSfb5ICTt73nD3QON1fnnpgNKBy- Jb5SeuGj185MNNw6g", "logo_url": "https://example.com/logo.PNG", "additional_notes": "2-4" }, "primary_recipients": [ { "billing_info": { "name": { "given_name": "Stephanie", "surname": "Meyers" }, "address": { "address_line_1": "1234 Main Street", "admin_area_2": "Anytown", "admin_area_1": "CA", "postal_code": "98765", "country_code": "US" }, "email_address": "bill-me@example.com", "phones": [ { "country_code": "001", "national_number": "4884551234", "phone_type": "HOME" } ], "additional_info_value": "add-info" }, "shipping_info": { "name": { "given_name": "Stephanie", "surname": "Meyers" }, "address": { "address_line_1": "1234 Main Street", "admin_area_2": "Anytown", "admin_area_1": "CA", "postal_code": "98765", "country_code": "US" } } } ], "items": [ { "name": "Yoga Mat", "description": "Elastic mat to practice yoga.", "quantity": "1", "unit_amount": { "currency_code": "USD", "value": "50.00" }, "tax": { "name": "Sales Tax", "percent": "7.25" }, "discount": { "percent": "5" }, "unit_of_measure": "QUANTITY" }, { "name": "Yoga t-shirt", "quantity": "1", "unit_amount": { "currency_code": "USD", "value": "10.00" }, "tax": { "name": "Sales Tax", "percent": "7.25" }, "discount": { "amount": { "currency_code": "USD", "value": "5.00" } }, "unit_of_measure": "QUANTITY" } ], "configuration": { "partial_payment": { "allow_partial_payment": true, "minimum_amount_due": { "currency_code": "USD", "value": "20.00" } }, "allow_tip": true, "tax_calculated_after_discount": true, "tax_inclusive": false, "template_id": "TEMP-19V05281TU309413B" }, "amount": { "breakdown": { "custom": { "label": "Packing Charges", "amount": { "currency_code": "USD", "value": "10.00" } }, "shipping": { "amount": { "currency_code": "USD", "value": "10.00" }, "tax": { "name": "Sales Tax", "percent": "7.25" } }, "discount": { "invoice_discount": { "percent": "5" } } } } })
    });

    console.log(`statusCode:${paypalInvoiceResponse.status}`)

    const invoice = await paypalInvoiceResponse.json()
    // console.log(invoice)

    // const list = await fetch(`'https://api-m.sandbox.paypal.com/v2/invoicing/invoices?total_required=true'`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`,
    //   }
    // })

    // const ppInvoices = await list.json()
    // console.log(ppInvoices)


    // const { data: invoice } = await got.post(`${appContext.env.PAYPAL_URL}/v2/invoicing/invoices`, {
    //   headers: {
    //     'Authorization': `Bearer ${paypalTokens.attributes.accessToken}`,
    //     'x-taco': "yes please"
    //   },

    // }).json()


    const { data: offerUpdate } = await got.put(`${appContext.env.BACKEND_URL}/api/offers/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${appContext.env.STRAPI_API_KEY}`
      },
      json: {
        data: {
          invoiceRecipientUrl: invoice.detail.metadata.recipient_view_url,
          invoiceInvoicerUrl: invoice.detail.metadata.invoicer_view_url
        }
      }
    }).json()

  } catch (e) {
    console.error(`Error while creating invoice`)
    console.error(e)
  }
}