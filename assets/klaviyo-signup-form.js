class KlaviyoSignupForm extends HTMLElement {
  constructor() {
    super();

    this.accountId = this.getAttribute('account-id');
    this.banner = document.querySelector('.banner--sticky-mobile');
    this.bannerCTA = document.querySelector('.sticky--banner-cta-button');
    this.bannerClose = document.querySelector('.sticky--banner-close-button');
    this.bannerContent = document.querySelector('.banner__content--text');
    this.listId = this.getAttribute('list-id');
    this.cta = this.getElement('.newsletter__cta');
    this.openButton = this.querySelector('[data-newsletter-show-form]');
    this.closeButtons = this.querySelectorAll('[js-modal-close]');
    this.form = this.querySelector('form');
    this.submitButton = this.form?.querySelector('[type="submit"]');
    this.formMessages = this.querySelector('.form__messages');
    this.succesMessage = this.getElement('.newsletter-success');

    /**
     * @type {HTMLTemplateElement | null}
     */
    this.errorTemplate = this.querySelector('#newsletter-error');

    // if (
    //   !this.form ||
    //   !this.cta ||
    //   !this.accountId ||
    //   !this.listId ||
    //   !this.submitButton ||
    //   !this.formMessages ||
    //   !this.succesMessage
    // ) {
    //   throw new Error('SiteNewsletter: elements missing or invalid attributes');
    // }

    window.addEventListener('CookiebotOnDecline', () => {
      setTimeout(this.openModal.bind(this), 20000);
    });

    window.addEventListener('CookiebotOnAccept', () => {
      setTimeout(this.openModal.bind(this), 20000);
    });

    setTimeout(this.openModal.bind(this), 20000);

    // open banner.
    this.bannerCTA?.addEventListener(
      'click',
      this.toggleBanner.bind(this, true),
    );
    this.bannerClose?.addEventListener(
      'click',
      this.toggleBanner.bind(this, false),
    );
  }

  connectedCallback() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.openButton?.addEventListener(
      'click',
      this.toggleForm.bind(this, true),
    );
    this.bannerCTA?.addEventListener(
      'click',
      this.toggleBanner.bind(this, true),
    );
    this.bannerClose?.addEventListener(
      'click',
      this.toggleBanner.bind(this, false),
    );
    this.closeButtons.forEach((button) => {
      button.addEventListener(
        'click',
        this.setCookie.bind(this, 'newsletter-dismissed', 'true', 30),
      );
    });
  }

  disconnectedCallback() {
    this.form.removeEventListener('submit', this.handleSubmit.bind(this));
    this.openButton?.removeEventListener(
      'click',
      this.toggleForm.bind(this, true),
    );
    this.bannerCTA?.removeEventListener(
      'click',
      this.toggleBanner.bind(this, true),
    );
    this.bannerClose?.removeEventListener(
      'click',
      this.toggleBanner.bind(this, false),
    );
    this.closeButtons.forEach((button) => {
      button.removeEventListener(
        'click',
        this.setCookie.bind(this, 'newsletter-dismissed', 'true', 30),
      );
    });
  }

  /**
   * @param {string} selector
   */
  getElement(selector) {
    const element = this.querySelector(selector);

    if (!(element instanceof HTMLElement)) {
      return null;
    }

    return element;
  }

  /**
   *
   * @param {string} name
   * @returns
   */
  getCookie(name) {
    let value = '; ' + document.cookie;
    let parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop()?.split(';').shift() ?? '';
  }

  /**
   *
   * @param {string} name
   * @param {string} value
   * @param {number} days
   */
  setCookie(name, value, days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    let expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/';
  }

  openModal() {
    if (
      !this.getCookie('newsletter-dismissed') &&
      this.getCookie('CookieConsent')
    ) {
      document.dispatchEvent(
        new CustomEvent('openModal', {
          bubbles: true,
          detail: {
            key: 'newsletter',
          },
        }),
      );
    }
  }

  toggleForm(show = true) {
    this.form.style.display = show ? 'block' : 'none';
    this.cta.style.display = show ? 'none' : 'block';
  }

  toggleBanner(show = true) {
    this.banner.style.height = show ? 'auto' : '85px';
    this.bannerCTA.style.display = show ? 'none' : 'block';
    this.bannerClose.style.display = show ? 'block' : 'none';
  }

  showSuccess() {
    this.form.style.display = 'none';
    this.bannerContent.style.display = 'none';
    this.succesMessage.style.display = 'block';
  }

  /**
   * @param {Event} event
   */
  handleSubmit(event) {
    event.preventDefault();
    this.submitButton.disabled = true;
    const formData = new FormData(this.form);
    const entries = Object.fromEntries(formData.entries());
    const attributes = this.filterAttributes(entries);
    const options = this.createFetchOptions({ id: this.listId, attributes });
    this.formMessages.innerHTML = '';

    fetch(
      `https://a.klaviyo.com/client/subscriptions?company_id=${this.accountId}`,
      options,
    )
      .then((response) => {
        if (!response.ok) {
          return response.json();
        }
        return { errors: false };
      })
      .then((data) => {
        if (data.errors) {
          const errorMessages = data.errors
            .map((/** @type {{ detail: string; }} */ error) => {
              console.error(error);
              return this.createErrorMessage(this.errorTemplate, error.detail);
            })
            .join('');

          this.formMessages.innerHTML = errorMessages;
        } else {
          this.showSuccess();
        }
        this.submitButton.disabled = false;
      });
  }

  /**
   * Creates an error message element from a template and a message string.
   * @param {HTMLTemplateElement | null} template - The template element to clone.
   * @param {string} message - The error message to display.
   *
   * @returns {string} The error message element as a string.
   */
  createErrorMessage(template, message) {
    if (!template) {
      return '';
    }

    const html = template?.content.cloneNode(true);

    if (html instanceof DocumentFragment) {
      const messageElement = html.querySelector('.form__message-text');

      if (messageElement) {
        messageElement.textContent = message;
      }
      return new XMLSerializer().serializeToString(html);
    }

    return '';
  }

  /**
   * Filters the given entries object, returning a new object with only the specified attributes
   * that are not undefined or empty.
   * @param {Object} entries - The source object containing the entries to filter.
   * @returns {Object} A new object containing only the specified attributes that are not undefined or empty.
   */
  filterAttributes(entries) {
    return ['email', 'phone_number', 'first_name', 'last_name'].reduce(
      (acc, key) => {
        if (entries[key] !== undefined && entries[key] !== '') {
          acc[key] = entries[key];
        }
        return acc;
      },
      {},
    );
  }

  /**
   * @param {{ id: string, attributes: Object }} options
   */
  createFetchOptions({ id, attributes }) {
    return {
      method: 'POST',
      headers: { revision: '2024-06-15', 'content-type': 'application/json' },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                attributes,
              },
            },
          },
          relationships: { list: { data: { type: 'list', id } } },
        },
      }),
    };
  }
}

if (!customElements.get('klaviyo-signup-form')) {
  customElements.define('klaviyo-signup-form', KlaviyoSignupForm);
}
