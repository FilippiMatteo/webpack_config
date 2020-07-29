import $ from 'jquery';
import jQuery from 'jquery';
import "./jquery/jquery-ui";
import  "./jquery/jquery-ui-i18n.min";

 import "./jcf/jcf";
 import "./jcf/jcf.checkbox";
 import "./jcf/jcf.range";
 import "./jcf/jcf.scrollable";
 import "./jcf/jcf.select";
import "./style.css";
import "./jcf/jcf.css";


// function createScript(url) {
//   var script = document.createElement('script');
//   script.src = url;
//   script.async=false;
//   script.defer = true;
//   script.type = 'text/javascript';
//   document.getElementsByTagName('head')[0].appendChild(script);
//   console.log("create :",url);
// }
//
// async function loadJquery() {
//   await createScript('http://rai.it/dl/components/js/vendor/jquery.min.js,q20160307121932.pagespeed.jm.BnirE05kB4.js');
//   await createScript('https://code.jquery.com/ui/1.12.1/jquery-ui.js');
//   await createScript("//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/i18n/jquery-ui-i18n.min.js");
//   console.log("load jquery")
// }
//
// async function loadJFC() {
//   var jcf_common_path = "./jcf/js/";
//
//   await createScript(jcf_common_path + "jcf.js");
//   await createScript(jcf_common_path + "jcf.range.js");
//   await createScript(jcf_common_path + "jcf.select.js");
//   await createScript(jcf_common_path + "jcf.checkbox.js");
//   await createScript(jcf_common_path + "jcf.scrollable.js");
//   console.log("load jfc");
// }
//
// async function loadUtilities() {
//   await createScript("./js/utilities.js");
//   console.log("load utilities");
// }


(async function ($, document, window, undefined) {
  // await loadJquery();
  // await loadJFC();
  // await loadUtilities();


  $(function() {
    console.log("loaded")
    $.datepicker.setDefaults( $.datepicker.regional[ "it" ] );
    $( "#datepickerUI" ).datepicker({
      showOtherMonths: true,
      endDate: new Date(),
      minDate: new Date(1900, 1 - 1, 1),
      yearRange: "1900:2020",
      maxDate:0,
      changeYear: true,
      changeMonth: false // cambiare questi a true per poter cambiare dalla barra in alto gli anni e i mesi velocemente
    });

  });


  //
  //var figurantiServiceUrl = 'https://atomatic.rai.it/figuranti-service';
  var figurantiServiceUrl = 'http://engine-dev.rai.it/figuranti-service';
  var figurantiAddresses = {
    formHTML: '/dl/components/include/figuranti_form.html',
    getValues: figurantiServiceUrl + '/api/values',
    registration: figurantiServiceUrl + '/api/figurante'
  };
  var getValues = function (values, successCb, errorCb) {
    if (typeof values === 'undefined') {
      return false;
    }
    $.ajax({
      type: 'POST',
      url: figurantiAddresses.getValues,
      data: JSON.stringify(values),
      contentType: 'application/json;charset=UTF-8',
      dataType: 'json',
      success: function (data) {
        if (typeof successCb == 'function') {
          successCb(data);
        }
      },
      error: function (jqRes, status, error) {
        if (typeof errorCb == 'function') {
          errorCb(jqRes, status, error);
        }
      }
    });
  };
  var registration = function (regData, successCb, errorCb) {
    if (typeof regData === 'undefined') {
      return false;
    }
    $.ajax({
      type: 'POST',
      url: figurantiAddresses.registration,
      data: regData,
      mimeType: 'multipart/form-data',
      contentType: false,
      processData: false,
      dataType: 'json',
      success: function (data) {
        if (typeof successCb == 'function') {
          successCb(data);
        }
      },
      error: function (jqRes, status, error) {
        if (typeof errorCb == 'function') {
          errorCb(jqRes, status, error);
        }
      }
    });
  };
   $.get(figurantiAddresses.formHTML + '?' + $.now(),async  function (data) {
    await $(data).appendTo('.figuranti.contenitore');
     window.jcf.replaceAll();
    figurantiForm();
    $('form').on('submit', function (e) {
      e.preventDefault();
      var context = $(this);
      context.addClass('loading');
      if ($('[name="figurante.consenso_privacy"][value="true"]:checked').length === 0) {
        showAlert('error', 'È necessario accettare il consenso privacy per poter continuare');
        context.removeClass('loading');
        return false;
      }
      registration(collectDataRegistration(),
        function (data) {
          if (data.esito == 0) {
            context.parent().prepend('<div class="row"><div class="columns small-12"><div class="request-sent"><h2>Richiesta inviata</h2><p class="text-center"><img src="/dl/components/img/ico-thumb-up.png"/>Grazie<br/>La tua richiesta ha avuto buon esito</p></div></div></div>');
            context.remove();
            $('form.loading').removeClass('loading');
          } else {
            //gestire la comparsa di errore
            showAlert('warning', data.message);
          }
          $('form.loading').removeClass('loading');
        },
        function (data) {
          context.removeClass('loading');
          var msg = data.responseJSON.errors.map(function (err) {
            return err.errorMessage;
          });
          //console.log('Esito negativo', data.responseJSON.errors)
          showAlert('error', msg.join('<br/>'));
        });
    });
  });

 async  function figurantiForm() {
    $("#Figuranti input[type=text], #Figuranti input[type=email]").focus(function () {
      //$(this).parent(".wrapperInput").find("label").addClass("top");
    }).keypress(function () {
      if ($(this).val() != "") {
        $(this).parent('.wrapperInput').find('.delete').fadeIn('400');
      } else {
        $(this).parent('.wrapperInput').find('.delete').fadeOut('400');
      }
    }).blur(function () {
      //if ($(this).val() == "") {
      // $(this).parent(".wrapperInput").find("label").removeClass("top");
      //}
    });
    $('.delete').click(function (e) {
      e.preventDefault();
      $(this).parent(".wrapperInput").find("input").val('');
      $(this).parent('.wrapperInput').find('.delete').fadeOut('400');
      //$(this).parent(".wrapperInput").find("label").removeClass("top");
    });
    $("input[type=number], input[type=date]").each(function () {
      $(this).parent(".wrapperInput").find("label").addClass("top");
      $(this).find(".delete").remove();
    });
    $('select[name="figurante.provinciaResidenza"], select[name="figurante.provinciaDomicilio"], select[name="figurante.provinciaStatoNascita"]').each(function () {
      populateProvince($(this));
    });
    $('select[name="colore_occhi"], select[name="colore_capelli"]').each(function () {
      populateOptions($(this), $(this).attr('name'));
    });

 await  populateOptions($('select[name="figurante.cittadinanza"]'), 'cittadinanza');
    $('select[name="figurante.cittadinanza"]').on('populate.end', function () {
      $('option[value="Italia"]').prop('selected', true);
      window.jcf.refreshAll();

    }).on('change', function () {
      enableCF(this.value === 'Italia');
      window.jcf.refreshAll();
      // window.jcf.getInstance($('select[name="figurante.cittadinanza"]')).refresh();

    });
    $('#statoNascita').on('change', function () {
      if (this.value == 'estero') {

        $("select[name='figurante.provinciaStatoNascita'], select[name='figurante.comuneStatoNascita']").empty().append('<option value="" class="noChoice">-- Stato non specificato --</option>');
        populateByForeignCountries($("select[name='figurante.provinciaStatoNascita']"));
        populateByForeignCountries($("select[name='figurante.comuneStatoNascita']"));
        window.jcf.getInstance($("select[name='figurante.provinciaStatoNascita']")).refresh();
        window.jcf.getInstance($("select[name='figurante.comuneStatoNascita']")).refresh();


      } else {

        $("select[name='figurante.provinciaStatoNascita'], select[name='figurante.comuneStatoNascita']").empty().append('<option value="" class="noChoice">-- Non specificato --</option>');
        populateProvince($("select[name='figurante.provinciaStatoNascita']"));
        window.jcf.getInstance($("select[name='figurante.provinciaStatoNascita']")).refresh();
        window.jcf.getInstance($("select[name='figurante.comuneStatoNascita']")).refresh();


      }
    });
  }

  function enableCF(enabled) {
    var CF = $('[name="figurante.codiceFiscale"]');
    if (enabled) {
      CF.attr('required', true).parent(".wrapperInput").removeClass('hide')
    } else {
      CF.attr('required', false).parent(".wrapperInput").addClass('hide')
    }
  }

  function populateProvince(select) {

    var values = {
      'type': 'provincia'
    };
    getValues(values, function (data) {
      data.forEach(function (entry) {
        select.append('<option value="' + entry.label + '">' + entry.value + '</option>');
      });
      select.off('change').on('change', function () {
        var communesSelect, selectName = $(this).attr('name');
        switch (selectName) {
          case 'figurante.provinciaResidenza':
            communesSelect = $('[name="figurante.residenza"]');
            break;
          case 'figurante.provinciaDomicilio':
            communesSelect = $('[name="figurante.domicilio"]');
            break;
          case 'figurante.provinciaStatoNascita':
            communesSelect = $('[name="figurante.comuneStatoNascita"]');
            break;
        }
        populateCommunes($(this).find('option:selected').val(), communesSelect);

      });
    }, function (data) {
      console.log('Non è stato possibile caricare le opzioni per ' + select.attr('name'));
    });
  }

  function populateCommunes(value, communesSelect) {
    if (value === "") {
      if (communesSelect.selector === '[name="figurante.comuneStatoNascita"]') {
        communesSelect.empty().append('<option disabled value="">Comune di nascita</option><option value="altro">-- Non specificato --</option>');
      } else {
        communesSelect.empty().append('<option value="" class="noChoice">-- Seleziona comune --</option>');
      }
    } else {
      var values = {
        'type': 'comune',
        'filter': value
      };
      getValues(values, function (data) {
        communesSelect.find('option:not([disabled])').remove();
        data.forEach(function (entry) {
          communesSelect.append('<option value="' + entry.label + '">' + entry.value + '</option>');
        });
        // window.jcf.getInstance($(`select${communesSelect.selector}`)).refresh();
        jcf.refreshAll();
      }, function (data) {
        console.log('Non è stato possibile caricare le opzioni per ' + communesSelect.attr('name'));
      });
    }

  }

  function populateByForeignCountries(select) {
    var values = {
      'type': 'cittadinanza'
    };
    getValues(values, function (data) {
      data.forEach(function (entry) {
        select.append('<option value="' + entry.label + '">' + entry.value + '</option>');
      });
      select.off('change').on('change', function () {
        var selectTochange, selectName = $(this).attr('name');
        var value = $(this).val();
        switch (selectName) {
          case 'figurante.provinciaStatoNascita':
            selectTochange = $('[name="figurante.comuneStatoNascita"]');

            jcf.getInstance($('select[name="figurante.comuneStatoNascita"]')).refresh();
            break;
          case 'figurante.comuneStatoNascita':
            selectTochange = $('[name="figurante.provinciaStatoNascita"]');
             jcf.getInstance($('select[name="figurante.provinciaStatoNascita"]')).refresh();

            break;
        }
        var option = selectTochange.find('option[value="' + value + '"]');
        option.prop('selected', true);
        // window.jcf.getInstance($(`select${selectTochange.selector}`)).refresh();
        jcf.refreshAll();


      });
    }, function (data) {
      console.log('Non è stato possibile caricare le opzioni per ' + select.attr('name'));
    });
  }

  function populateOptions(select, type) {
    var values = {
      'type': type
    };
    getValues(values,
      function (data) {
        select.find('option:not([disabled], .noChoice)').remove();
        data.forEach(function (entry) {
          select.append('<option value="' + entry.value + '">' + entry.label + '</option>');
        });
        select.trigger('populate.end');
      },
      function (data) {
        console.log('Non è stato possibile caricare le opzioni per ' + select);
      });
  }

  function collectDataRegistration() {
    var regData = new FormData();
    $('input[type=text], input[type=number], input[type=email], input[type=password], input[type=radio][data-name]:checked, textarea').each(function () {
      regData.append($(this).attr('data-name'), this.value);
    });
    $('input[type=date]').each(function () {
      var date;
      if (this.value.indexOf('/') >= 0) {
        date = moment(this.value, 'DD/MM/YYYY').format('YYYYMMDD');
      } else {
        date = moment(this.value, 'YYYY-MM-DD').format('YYYYMMDD');
      }
      if (date != 'Invalid date') {
        regData.append($(this).attr('data-name'), date);
      }
    });
    $('input[type=file]').each(function () {
      if (this.files[0]) {
        regData.append('files', this.files[0]);
      }
    });
    $('select').each(function () {
      regData.append($(this).attr('data-name'), this.value);
    });
    return regData;
  }

  let showAlert = function (style, message) {
    var alert = $("[data-alert]");
    var closeBtn = alert.find("a.close");
    alert.find("span").html(message);
    alert.removeAttr("class");
    alert.addClass("alert-box " + style).removeClass('comparsa');
    closeBtn.click(function (event) {
      event.preventDefault();
      alert.attr("class", "alert-box comparsa");
    });
    scrollToTop();
  };
   let scrollToTop = function () {
    var top = $('.containerFiguranti').length > 0 ? $('.containerFiguranti').offset().top - 100 : 0;
    $("html, body").animate({
      scrollTop: top
    }, "slow");
  };
}(jQuery, document, window));
