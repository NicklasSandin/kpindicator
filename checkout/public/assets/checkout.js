/* ---------------------------------------------------------------------------
   The only JavaScript in this checkout.

   Card data has to be entered inside an iframe Stripe serves, or this origin
   would be in PCI scope — that iframe is the whole reason this file exists.
   Everything else (the amount, the PaymentIntent, the buyer record, the
   confirmation, the order row) is decided by PHP; this file just carries
   values between the form and Stripe.js.
--------------------------------------------------------------------------- */

(function () {
  "use strict";

  var form = document.getElementById("payment-form");
  if (!form || typeof Stripe !== "function") {
    return;
  }

  var submitButton = document.getElementById("submit");
  var buttonText = document.getElementById("button-text");
  var spinner = document.getElementById("spinner");
  var messageBox = document.getElementById("payment-message");
  var mountPoint = document.getElementById("payment-element");
  var emailInput = document.getElementById("email");

  var endpoints = {
    intent: form.dataset.endpointIntent,
    buyer: form.dataset.endpointBuyer,
    returnUrl: form.dataset.returnUrl,
  };

  var csrfMeta = document.querySelector('meta[name="csrf-token"]');
  var csrfToken = csrfMeta ? csrfMeta.getAttribute("content") : "";

  var stripe = Stripe(form.dataset.publishableKey);
  var elements = null;
  var paymentIntentId = null;
  var submitting = false;

  /* The Payment Element inherits the page's design system rather than Stripe's
     default. Values mirror checkout.css: ink for primary, warm paper for the
     surface, Archivo for text, IBM Plex Mono nowhere — form fields are UI. */
  var appearance = {
    theme: "flat",
    variables: {
      colorPrimary: "#1e1813",
      colorBackground: "#fffefb",
      colorText: "#191511",
      colorTextSecondary: "#655f59",
      colorTextPlaceholder: "#a49d94",
      colorDanger: "#de2326",
      fontFamily: 'Archivo, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSizeBase: "15px",
      borderRadius: "6px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        border: "1px solid #dddad4",
        boxShadow: "none",
        padding: "11px 13px",
      },
      ".Input:focus": {
        border: "1px solid #191511",
        boxShadow: "0 0 0 3px rgba(229, 140, 46, 0.22)",
        outline: "none",
      },
      ".Label": {
        color: "#655f59",
        fontSize: "11px",
        letterSpacing: "0.11em",
        textTransform: "uppercase",
        fontWeight: "500",
      },
      ".Tab": { border: "1px solid #dddad4", boxShadow: "none" },
      ".Tab--selected": { border: "1px solid #191511", boxShadow: "none" },
    },
  };

  function showMessage(text) {
    if (!messageBox) return;
    if (!text) {
      messageBox.hidden = true;
      messageBox.textContent = "";
      return;
    }
    messageBox.textContent = text;
    messageBox.hidden = false;
  }

  function setBusy(busy) {
    submitting = busy;
    if (submitButton) submitButton.disabled = busy;
    if (spinner) spinner.hidden = !busy;
    if (buttonText) buttonText.style.opacity = busy ? "0.7" : "1";
  }

  function postJson(url, payload) {
    return fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(payload),
    }).then(function (response) {
      return response
        .json()
        .catch(function () {
          return {};
        })
        .then(function (body) {
          if (!response.ok) {
            throw new Error(body.error || "That didn't work. Please try again.");
          }
          return body;
        });
    });
  }

  /* Step 1 — ask PHP for a PaymentIntent and mount the element. */
  postJson(endpoints.intent, { packageId: form.dataset.package })
    .then(function (data) {
      if (!data.clientSecret) {
        throw new Error("Stripe did not return a payment session.");
      }

      paymentIntentId = data.paymentIntentId;
      elements = stripe.elements({ clientSecret: data.clientSecret, appearance: appearance });

      var paymentElement = elements.create("payment", { layout: "tabs" });
      if (mountPoint) mountPoint.innerHTML = "";
      paymentElement.mount("#payment-element");

      paymentElement.on("ready", function () {
        if (submitButton) submitButton.disabled = false;
      });
      paymentElement.on("change", function (event) {
        showMessage(event.error ? event.error.message : "");
      });
    })
    .catch(function (error) {
      /* Nothing is going to mount, so give the reserved height back rather
         than leaving a screen of blank paper above the error. */
      if (mountPoint) {
        mountPoint.innerHTML = "";
        mountPoint.style.minHeight = "0";
      }
      showMessage(error.message);
    });

  /* Step 2 — hand the buyer's details to PHP, then let Stripe confirm. */
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (submitting || !elements) return;

    var email = emailInput ? emailInput.value.trim() : "";
    if (!email || email.indexOf("@") === -1) {
      showMessage("Enter the email address your receipt and intake link should go to.");
      if (emailInput) emailInput.focus();
      return;
    }

    setBusy(true);
    showMessage("");

    postJson(endpoints.buyer, {
      paymentIntentId: paymentIntentId,
      email: email,
      name: (document.getElementById("name") || {}).value || "",
      company: (document.getElementById("company") || {}).value || "",
    })
      .then(function () {
        return stripe.confirmPayment({
          elements: elements,
          confirmParams: { return_url: endpoints.returnUrl },
        });
      })
      .then(function (result) {
        /* confirmPayment only resolves when the payment failed immediately;
           anything that succeeded or needs a redirect has already navigated
           away by this point. */
        if (result && result.error) {
          showMessage(
            result.error.type === "card_error" || result.error.type === "validation_error"
              ? result.error.message
              : "Something went wrong confirming that payment. Nothing was charged."
          );
        }
        setBusy(false);
      })
      .catch(function (error) {
        showMessage(error.message);
        setBusy(false);
      });
  });
})();
