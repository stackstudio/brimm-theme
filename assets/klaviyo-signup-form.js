if (!customElements.get('klaviyo-signup-form')) {
  customElements.define(
    'klaviyo-signup-form',
    class KlaviyoSignupForm extends HTMLElement {
      constructor() {
        super();
        this.form = document.querySelector('.klaviyo-signup-form');
        this.input = this.form.querySelector('input[type="email"]');
        this.submitButton = this.form.querySelector('button[type="submit"]');
        this.error = this.form.querySelector('.klaviyo-signup-form__error');
        this.success = this.form.querySelector('.klaviyo-signup-form__success');

        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        console.log('KlaviyoSignupForm initialized');
      }

      async handleSubmit(event) {
        event.preventDefault();
        console.log(event);

        this.error.textContent = '';
        this.success.textContent = '';

        if (!this.input.value) {
          this.error.textContent = 'Please enter an email address.';
          return;
        }

        this.submitButton.disabled = true;

        const email = this.input.value;
        const publicApiKey = 'RJAyDu'; // Replace with your actual public API key

        const data = {
          profiles: [{ email: email }],
        };

        console.log(data);

        try {
          const response = await fetch(
            `https://a.klaviyo.com/api/v2/list/UdQf4b/subscribe?api_key=${publicApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            },
          );

          const result = await response.json();
          if (response.ok) {
            alert('Successfully subscribed!');
          } else {
            alert('Error: ' + result.detail);
          }
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
        }
      }
    },
  );
}
