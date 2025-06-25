if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector('cart-notification') ||
          document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('cart-drawer'))
          this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';

        this.membershipPlans = {
          pioneer: {
            variantId: 48578732097878,
            sellingPlanId: 690226200918,
          },
          explorer: {
            variantId: 48556931481942,
            sellingPlanId: 690221023574,
          },
        };

        this.planRadios = document.getElementsByName('purchase_option');
      }

      async onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        const selectedOption = Array.from(this.planRadios).find(
          (r) => r.checked,
        )?.value;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const cartSectiondata = this.cart
          .getSectionsToRender()
          .map((section) => section.id);

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append('sections', cartSectiondata);
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        try {
          await fetch(`${routes.cart_add_url}`, config)
            .then((response) => response.json())
            .then((response) => {
              if (response.status) {
                publish(PUB_SUB_EVENTS.cartError, {
                  source: 'product-form',
                  productVariantId: formData.get('id'),
                  errors: response.errors || response.description,
                  message: response.message,
                });
                this.handleErrorMessage(response.description);

                const soldOutMessage =
                  this.submitButton.querySelector('.sold-out-message');
                if (!soldOutMessage) return;
                this.submitButton.setAttribute('aria-disabled', true);
                this.submitButtonText.classList.add('hidden');
                soldOutMessage.classList.remove('hidden');
                this.error = true;
                return;
              } else if (!this.cart) {
                window.location = window.routes.cart_url;
                return;
              }

              if (!this.error)
                publish(PUB_SUB_EVENTS.cartUpdate, {
                  source: 'product-form',
                  productVariantId: formData.get('id'),
                  cartData: response,
                });
              this.error = false;
              const quickAddModal = this.closest('quick-add-modal');
              if (quickAddModal) {
                document.body.addEventListener(
                  'modalClosed',
                  () => {
                    setTimeout(() => {
                      // this.cart.renderContents(response);
                    });
                  },
                  { once: true },
                );
                quickAddModal.hide(true);
              } else {
                this.cart.renderContents(response);
              }
            })
            .catch((e) => {
              console.error(e);
            })
            .finally(() => {
              this.submitButton.classList.remove('loading');
              if (this.cart && this.cart.classList.contains('is-empty'))
                this.cart.classList.remove('is-empty');
              if (!this.error)
                this.submitButton.removeAttribute('aria-disabled');
              this.querySelector('.loading__spinner').classList.add('hidden');
            });
        } catch (error) {
          console.error('Error adding main product to cart:', error);
        }

        if (selectedOption === 'explorer' || selectedOption === 'supporter') {
          const membership = this.membershipPlans[selectedOption];
          console.log(
            `Adding ${selectedOption} membership to cart`,
            membership,
          );

          try {
            await fetch(`${routes.cart_add_url}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                form_type: 'product',
                id: membership.variantId,
                quantity: 1,
                selling_plan: membership.sellingPlanId,
              }),
            }).then((response) => response.json());
          } catch (error) {
            console.error('Error adding membership to cart:', error);
          }
        }
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            '.product-form__error-message',
          );

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    },
  );
}
