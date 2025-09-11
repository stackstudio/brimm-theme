var simplee_membership = {
  init: function () {
    window.host = '{{ host }}';
    this.getSubscriber('', 1, true);
    this.changeContract();
    this.getCredit(null);
    this.handleButtonClicks();
    this.getStates();
  },
  getCredit: function (customer_id) {
    let base = this;
    const apiHost = 'https://shopify-credit-processor-4ohdj67qkq-uc.a.run.app';
    const customerID = sessionStorage.getItem('X-shopify-customer-ID');
    if (customer_id == null) {
      customer_id = customerID;
    }
    if (!customer_id) {
      return false;
    }
    $.ajax({
      url: apiHost + '/api/balance-sync/customer/' + customer_id,
      type: 'GET',
      crossDomain: true,
      headers: {
        'Content-Type': 'application/json',
      },
      success: function (res) {
        // const r = JSON.parse(res);
        const balanceEl = document?.querySelector('.balance-current');
        console.log(balanceEl);
        if (res.success) {
          console.log(res.data);
          balanceEl.innerHTML(res.data.shopifyBalance);
        }
      },
    });
  },
  getSubscriber: function (contract_id, init_load, isCallInit) {
    if (!init_load) {
      $('.not_waiting').css('display', 'none');
      $('.is_waiting').css('display', 'block');
    }
    let CustomerID = sessionStorage.getItem('X-shopify-customer-ID');
    let shop = '{{ shop }}';
    let base = this;
    $.ajax({
      url: host + '/api/liquidPortalsubscriber',
      type: 'post',
      data: {
        _method: 'post',
        _token: '{{ csrf_token() }}',
        customer: CustomerID,
        shop: shop,
        contract: contract_id,
        init_load: init_load,
      },
      success: function (res) {
        let r = JSON.parse(res);
        var main = document.getElementById('portal');
        main.innerHTML = r.html;
        if (r.isContract) {
          let data = r.data;
          sessionStorage.setItem(
            'X-sm-portal',
            base.utf8_to_b64(JSON.stringify(data)),
          );
          base.updateSubTotalPrice();
          base.setmodalText();
          $('not-waiting').css('display', 'block');
          $('is-waiting').css('display', 'none');
        }
      },
    });
  },
  utf8_to_b64: function (str) {
    return window.btoa(unescape(encodeURIComponent(str)));
  },
  b64_to_utf8: function (str) {
    return decodeURIComponent(escape(window.atob(str)));
  },
  handleButtonClicks: function () {
    let base = this;
    // Update Billing
    $(document).on('click', '#billingInfo', function () {
      if ($('.billing-acc').hasClass('collapsed')) {
        $('.billing-acc').removeClass('collapsed');
        $('#billingInfoInner').addClass('show');
      } else {
        $('#billingInfoInner').removeClass('show');
        $('.billing-acc').addClass('collapsed');
      }
    });
    $(document).on('click', '#simplee_order_edit_icon', function () {
      let sc = $('#simplee_order_info').css('display');
      if (sc == 'block') {
        $('#simplee_order_info').css('display', 'none');
        $('#simplee_edit_order_info').css('display', 'block');
        base.getStates();
      }
    });
    $(document).on('click', '#simplee_order_edit_cancel', function () {
      $('#simplee_order_info').css('display', 'block');
      $('#simplee_edit_order_info').css('display', 'none');
      $('.sm_saving').css('display', 'none');
      $('.sm_save').css('display', 'inline-block');
    });
    $(document).on('click', '#select_countries', function () {
      base.getStates();
    });
    $(document).on('click', '.sm_save_data', function () {
      let saveType = $(this).attr('data-save');
      base.saveChanges(saveType);
    });
    $(document).on('click', '.open_modal', function () {
      let modalType = $(this).attr('data-modal');
      base.showModal(modalType);
    });
    $(document).on('click', '.close_modal', function () {
      base.closemodal();
    });
    $(document).on('click', '#select_cancel_reason', function () {
      let s = $('option:selected', this).text();
      $('#other_cancel_reason').attr('style', 'display: none !important');
      if (s == 'Other') {
        $('#other_cancel_reason').attr('style', 'display: block !important');
      }
    });
  },
  updateSubTotalPrice: function () {
    let data = JSON.parse(
      this.b64_to_utf8(sessionStorage.getItem('X-sm-portal')),
    );
    let base = this;
    let subTotalPrice = 0;
    let summarySubtotal = 0;
    let current_total_price = 0;
    let currencySymbol = '';
    let shippingPrice = 0;
    data.membership.lineItems.forEach(function callbackFn(el, index) {
      let dis_type = el.discount_type;
      let dis_amt = parseFloat(el.discount_amount);
      currencySymbol = el.currency_symbol;
      let amt = '';
      let cal_price = el.price * el.quantity;
      if (dis_type == '%') {
        amt = (cal_price - (cal_price * dis_amt) / 100).toFixed(2);
      } else if (dis_type == data.shop.currency) {
        amt = (cal_price - dis_amt).toFixed(2);
      }
      amt = el.quantity == 0 ? '00.00' : amt;
      subTotalPrice = (parseFloat(subTotalPrice) + cal_price).toFixed(2);
    });

    shippingPrice =
      typeof data.order != 'undefined' && data.order.shipping_lines.length > 0
        ? data.order.shipping_lines[0].price
        : 0;

    summarySubtotal = parseFloat(subTotalPrice).toFixed(2);
    current_total_price = (
      parseFloat(summarySubtotal) + parseFloat(shippingPrice)
    ).toFixed(2);
    $('.sub-total-price').html(
      this.filterPrice(subTotalPrice, data.membership.currency_code),
    );
    $('.current-total-price').html(
      this.filterPrice(current_total_price, data.membership.currency_code),
    );
    $('.shipping-price').html(
      this.filterPrice(shippingPrice, data.membership.currency_code),
    );
    $('.summary-subtotal').html(
      this.filterPrice(summarySubtotal, data.membership.currency_code),
    );
  },
  filterPrice: function (price, currency) {
    return currency == 'JPY'
      ? Number(price).toFixed(0)
      : Number(price).toFixed(2);
  },
  changeContract: function () {
    let base = this;
    $(document).on('change', '#dp_membership_contracts', function () {
      base.getSubscriber(this.value, 0, false);
    });
  },
  getStates: function () {
    let base = this;
    let data = JSON.parse(
      this.b64_to_utf8(sessionStorage.getItem('X-sm-portal')),
    );
    let country = $('#select_countries').find(':selected').text();
    if (country) {
      $.ajax({
        url: host + '/api/country/' + country,
        type: 'get',
        success: function (res) {
          let states = res.data.states;
          var mySelect = $('#select_states');
          option = [];
          mySelect.empty();
          $.each(states, function (val, text) {
            option[i] = $(
              '<option value="' +
                text +
                '" data-province="' +
                val +
                '">' +
                text +
                '</option>',
            );
            if (data.membership.shipping_stateprovname == text) {
              option[i].attr('selected', 'selected');
            }
            mySelect.append(option);
          });
        },
      });
    }
  },
  async saveChanges(type) {
    let simpleeContractData = JSON.parse(
      this.b64_to_utf8(sessionStorage.getItem('X-sm-portal')),
    );
    let base = this;
    if (type == 'edit_shipping_address') {
      simpleeContractData.membership.ship_firstName = $(
        '#shipping_firstname',
      ).val();
      simpleeContractData.membership.ship_lastName =
        $('#shipping_lastname').val();
      simpleeContractData.membership.ship_company =
        $('#shipping_company').val();
      simpleeContractData.membership.ship_address1 =
        $('#shipping_address1').val();
      simpleeContractData.membership.ship_address2 =
        $('#shipping_address2').val();
      simpleeContractData.membership.ship_phone = $('#shipping_phone').val();
      simpleeContractData.membership.ship_city = $('#shipping_city').val();
      simpleeContractData.membership.ship_province = $('#select_states')
        .find(':selected')
        .text();
      simpleeContractData.membership.ship_provinceCode = $('#select_states')
        .find(':selected')
        .data('province');
      simpleeContractData.membership.ship_zip = $('#shipping_postalzip').val();
      simpleeContractData.membership.ship_country = $('#select_countries')
        .find(':selected')
        .text();
    }
    $('.sm_saving').css('display', 'inline-block');
    $('.sm_save').css('display', 'none');
    let data = {
      contract_id: simpleeContractData.membership.id,
      type: type,
      shop: simpleeContractData.shop.domain,
      mode: 'api',
      contract: type == 'portal_all' ? [] : simpleeContractData.membership,
      deleted: [],
      line_items:
        type == 'portal_all' ? simpleeContractData.membership.lineItems : [],
    };
    if (type == 'cancelled') {
      $('.sm_saving').css('display', 'none');
      $('.sm_save').css('display', 'inline-block');
      let form = document.getElementById('cancellation_reasons_form');
      if (form) {
        let required_reason = form.querySelector(
          'input[name="required_reason"]',
        );
        let newReason = form.querySelector(
          'input[name="cancellation_reason"]:checked',
        );
        if (newReason) {
          let customReason = form.querySelector('input[name="custom_reason"]');
          if (newReason.value == 'other') {
            if (customReason.value == '') {
              document.getElementById('custom_msg').style.display = 'block';
              return false;
            }
            data.selectedReason = customReason.value;
          } else {
            data.selectedReason = newReason.value;
          }
        } else {
          if (required_reason.value == 1) {
            document.getElementById('error_message').style.display = 'block';
            return false;
          }
        }
      }
      data.selectedCancellation = $('#select_cancel_reason :selected').text();
      data.otherReason = $('#other_cancel_reason').val();
    }

    let url = host + '/api/subscriber/store';
    $('.sm_saving').css('display', 'inline-block');
    $('.sm_save').css('display', 'none');
    $.ajax({
      url: url,
      type: 'post',
      data: { _method: 'post', _token: '{{ csrf_token() }}', data: data },
      success: function (res) {
        if (res.isSuccess) {
          sessionStorage.setItem(
            'X-sm-portal',
            base.utf8_to_b64(JSON.stringify(simpleeContractData)),
          );
          $('#simplee_order_info').css('display', 'block');
          $('#simplee_edit_order_info').css('display', 'none');
          base.closemodal();
          base.showToast('info', res.data);
          location.reload();
        } else {
          base.showToast('error', res.data);
        }
        $('.sm_saving').css('display', 'none');
        $('.sm_save').css('display', 'inline-block');
      },
    });
  },
  showToast: function (type, text) {
    // Get the snackbar DIV
    var x = document.getElementById('snackbar');
    var content = document.getElementsByClassName('snackbar_inner')[0];
    content.innerHTML = text;
    // Add the "show" class to DIV
    x.className = 'show ' + type;
    // After 3 seconds, remove the show class from DIV
    setTimeout(function () {
      x.className = x.className.replace('show', '');
    }, 3000);
  },
  showModal: function (type) {
    let modalTexts = JSON.parse(
      this.b64_to_utf8(sessionStorage.getItem('X-sm-modal')),
    );
    let currentConfirm = modalTexts[type];
    $('.cancel_reason_row').css('display', 'flex');
    if (type == 'resume_membership') {
      $('.cancel_reason_row').css('display', 'none');
    }
    $('#sm_modal_title').html(currentConfirm.title);
    $('#sm_modal_label').html(currentConfirm.label);
    $('#sm_close_modal').html(currentConfirm.cancel_text);
    $('#sm_modal_save').html(currentConfirm.ok_text);
    $('#sm_modal_save').attr('data-save', currentConfirm.action);
    document.body.classList.add('open-modal');
  },
  closemodal() {
    document.body.classList.remove('open-modal');
    $('.sm_saving').css('display', 'none');
    $('.sm_save').css('display', 'inline-block');
  },
  setmodalText: function () {
    let base = this;
    let data = JSON.parse(
      this.b64_to_utf8(sessionStorage.getItem('X-sm-portal')),
    );
    let language = data.language;
    let settingsData = data.settings;
    let ok_text_display = language.portal_action_cancel;
    let cancel_text_display = language.portal_popup_cancel_no;
    if (settingsData) {
      if (settingsData.cancellation_reason_enable == 1) {
        ok_text_display = settingsData.custom_submit;
        cancel_text_display = settingsData.custom_cancel;
      }
    }
    let modalText = {
      cancel_membership: {
        title: language.portal_popup_cancel_title,
        label: language.portal_popup_cancel_text,
        ok_text: ok_text_display,
        cancel_text: cancel_text_display,
        is_cancel: 1,
        action: 'cancelled',
      },
      pause_membership: {
        title: 'Pause your membership?',
        label: 'Are you sure you would like to pause this membership?',
        ok_text: 'Pause membership',
        cancel_text: language.portal_popup_cancel_no,
        is_cancel: 1,
        action: 'paused',
      },
      resume_membership: {
        title: 'Resume your membership?',
        label: 'Are you sure you would like to resume this membership?',
        ok_text: 'Resume membership',
        cancel_text: language.portal_popup_cancel_no,
        is_cancel: 1,
        action: 'resumed',
      },
    };
    sessionStorage.setItem(
      'X-sm-modal',
      base.utf8_to_b64(JSON.stringify(modalText)),
    );
  },
};
$(document).on('click', '#cancellation_reasons_form', function () {
  let form = document.getElementById('cancellation_reasons_form');
  let additionalReasonRadio = document.getElementById(
    'cancellation_other_reason',
  );
  let customReasonTextbox = document.getElementById('custom_reason_textbox');
  let custom_reason = document.getElementById('custom_reason');
  if (form) {
    if (additionalReasonRadio.value == 'other') {
      if (custom_reason == '') {
        document.getElementById('custom_msg').style.display = 'block';
      } else {
        document.getElementById('custom_msg').style.display = 'none';
      }
    }
    form.addEventListener('change', function (event) {
      document.getElementById('error_message').style.display = 'none';
      document.getElementById('custom_msg').style.display = 'none';
      if (additionalReasonRadio && customReasonTextbox) {
        if (
          additionalReasonRadio.checked &&
          additionalReasonRadio.value == 'other'
        ) {
          customReasonTextbox.style.display = 'block';
        } else {
          customReasonTextbox.style.display = 'none';
        }
      }
    });
  }
});
$(document).ready(function () {
  simplee_membership.init();
});
