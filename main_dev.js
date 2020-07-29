(function($, document, window, undefined) {

  window.relatedJsonUrl = null;
  window.disablePredictionRai = null;

  var profileObj;
  var root = '/raicasting/';
  var homePage = root;
  var loginPage = root + 'Rai-Casting---Accedi-981730e7-9177-4769-afbd-83d14c2dbe7f.html';
  var registrationPage = root + 'Rai-Casting---Registrati-d3d93e21-d021-4e74-9d37-2c03b78731b0.html';
  var profiloPage = root + 'Rai-Casting---Profilo-9ddd68a0-a23b-40dc-aa24-5e1e8d9675e7.html';
  var iTuoiCastingPage = root + 'Rai-Casting---I-tuoi-casting-71dbdd57-14a2-4fcb-b004-a582395d6727.html';
  var castingApertiPage = root + 'Rai-Casting---Casting-Aperti-27ecf501-00ac-4956-9105-804991f135bb.html';
  var modificaPasswordPage = root + 'Rai-Casting---Modifica-password-42868897-3042-43e4-b2d5-d36ed9a5329c.html';
  var recuperaPasswordPage = root + 'Rai-Casting---Recupera-password-9db654e9-7a92-4903-ba02-678fa9b78527';

  var accessDeniedPagePages = [
    profiloPage,
    iTuoiCastingPage
  ];

  var methods = (function() {
    var castingServiceUrl = 'https://atomatic.rai.it';
    //var castingServiceUrl = 'http://10.99.40.16:6060';
    var canCallAuthService = true;
    var castingAddresses = {
      registration: castingServiceUrl + '/casting-service/api/registraUtente',
      login: castingServiceUrl + '/casting-service/api/loginUtente',
      castingSubmission: castingServiceUrl + '/casting-service/api/iscrizioneProgramma',
      yourCasting: castingServiceUrl + '/casting-service/api/recuperaMieiProgrammi',
      yourProfile: castingServiceUrl + '/casting-service/api/recuperaDatiPersonali',
      sendProfile: castingServiceUrl + '/casting-service/api/modificaDatiPersonali',
      getValues: castingServiceUrl + '/casting-service/api/values',
      changePasswordUrl: castingServiceUrl + '/casting-service/api/modificaDatiLogin',
      retrievePasswordUrl: castingServiceUrl + '/casting-service/api/recuperaPassword'
    };

    var checkLogin = function() {

      castingUserObject = getStorage('castingCookie');
      return castingUserObject;

    };
    var refreshAuthToken = function() {
      var res = $.ajax({
        type: 'POST',
        url: castingSSOTokenRefresh,
        data: {
          domainApiKey: window.castingSSODomainApiKey,
          refreshToken: castingUserObject.refreshToken
        },
        success: function(data) {
          if (data.response == "KO") {
            if (data.detail == "DELETEREQUIRED") {
              softLogout(document.location.reload());
            }
          } else {
            canCallAuthService = true;
            //castingUserObject.authToken = data;
            setStorage(castingSSOCookie, castingUserObject);
          }
        },
        error: function(jqRes, status, error) {
          canCallAuthService = true;
          console.log(jqRes.status);
          console.log(status);
          console.log(error);
        }
      });
      return res;
    };
    var callCastingSSOAuthService = function(ajaxObj, secondStep) {
      //funzione da usare per chiamare i servizi castingSSO che necessitano di x-auth-token con scadenza temporizzata
      if (!checkLogin()) {
        return false;
      }
      if (typeof ajaxObj != 'object') {
        return false;
      }
      /*
    if (!window.castingUserObject.authToken && !window.castingUserObject.refreshToken) {
        return false;
    }
            */
      if (typeof secondStep != 'number') {
        secondStep = 0;
      }
      if (canCallAuthService || secondStep > 0) {
        //inibisce le chiamate sovrapposte per evitare loop infiniti sul refresh. Il secondo parametro deve essere TRUE solo dopo il refresh del token
        if (secondStep > 1) {
          //in caso di errore di chiave lato server,interrompo il loop di refresh al secondo tentativo di chiamata al servizio autenticato;
          console.warn('Refresh token loop. Server Error.');
          return false;
        }
        canCallAuthService = false;
        var successFunc, errorFunc;
        if (typeof ajaxObj.headers != 'object') {
          ajaxObj.headers = {};
        }
        /* ajaxObj.headers['X-Auth-Token'] = window.castingUserObject.authToken; */
        successFunc = ajaxObj.success;
        errorFunc = ajaxObj.error;
        delete ajaxObj.success;
        delete ajaxObj.error;
        var jqxhr = $.ajax(ajaxObj).done(function(data) {
          canCallAuthService = true;
          if (typeof successFunc == 'function') {
            successFunc(data);
          }
        }).fail(function(jqRes, status, error) {
          console.log(jqRes.status);
          console.log(status);
          console.log(error);
          if (jqRes.status == 401) {
            /*
    refreshAuthToken().done(function() {
        ajaxObj.success = successFunc;
        ajaxObj.error = errorFunc;
        callCastingSSOAuthService(ajaxObj, secondStep + 1);
    });
                        */
          } else {
            /*
    canCallAuthService = true;
    if (typeof errorFunc == 'function') {
        errorFunc(jqRes, status, error);
    }
                        */
          }
        }).always(function(jqxhr) {
          if (jqxhr.status != 401) {
            /*
    if (authServiceStack.length > 0) {
        //chiama le funzioni appese in stack
        ajaxObj = authServiceStack.shift();
        callCastingSSOAuthService(ajaxObj);
    }
                        */
          }
        });
        return jqxhr;
      } else {
        //appende le chiamate in stack se troppo ravvicinate e rischiano di generare loop di refresh.
        authServiceStack.push(ajaxObj);
      }
    };
    var setUserObject = function(data, successCb) {

      castingCookieObject = data.idUtente;
      setStorage('castingCookie', castingCookieObject);
      successCb(data);

    };
    var setStorage = function(cookieName, castingCookieObject) {

      if (typeof cookieName !== "string") {
        throw new Error('Cookie sconusciuto');
      }
      if (typeof castingCookieObject !== "string") {
        throw new Error('Dati Cookie mancanti');
      }
      if (!castingCookieObject.expiration) {
        castingCookieObject.expiration = (new Date()).getTime() + 86400000;
      }
      if (isLocalStoragevalid()) {
        localStorage.setItem(cookieName, JSON.stringify(castingCookieObject));
      } else {
        utils.cookie.set(cookieName, encodeURI(JSON.stringify(castingCookieObject)), 360, '/', document.location.host);
      }
    };
    var getStorage = function(cookieName) {
      if (typeof cookieName !== "string") {
        cookieName = castingCookie;
      }
      if (isLocalStoragevalid()) {
        return localStorage.getItem(cookieName) === null ? null : JSON.parse(localStorage.getItem(cookieName));
      } else {
        return utils.cookie.get(cookieName) === "" ? null : JSON.parse(decodeURI(utils.cookie.get(cookieName)));
      }
    };
    var deleteStorage = function(cookieName) {
      if (typeof cookieName !== "string") {
        cookieName = castingCookie;
      }
      if (isLocalStoragevalid()) {
        localStorage.removeItem(cookieName);
      } else {
        utils.cookie.remove(cookieName, '/', document.location.host);
      }
    };
    var softLogout = function() {
      /*
      if (window.raissoAfterLogCallback && typeof window.raissoAfterLogCallback === 'function') {
              delete window.raissoAfterLogCallback;
      }

      window.castingUserObject = undefined;
      window.objUserCookie = {};
      */
      deleteStorage('castingCookie');
      deleteStorage('userCasting');

      window.location.href = loginPage;

      /*
      $(document).trigger('raissoUserLogout');
      if (callback && typeof (callback) === "function") {
              callback();
      }
      */
    };
    var sendLogin = function(user, password, successCb, errorCb) {
      var obj = {
        user: user,
        password: password
      };
      $.ajax({
        type: 'POST',
        url: castingAddresses.login,
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json',
        data: JSON.stringify(obj),
        success: function(data) {
          if (data.esito === 0) {
            if (typeof successCb == 'function') {
              setUserObject(data, successCb);
            }
          } else {
            //gestire la comparsa di errore
            utils.showAlert('warning', data.descrizione);
            $('form.loading').removeClass('loading');
          }
        },
        error: function(jqRes, status, error) {
          castingSSOError = jqRes;
          //console.log('Errore: ' + jqRes.status + ' ' + jqRes.statusText);
          if (typeof errorCb == 'function') {
            errorCb(jqRes, status, error);
          }
        },
        done: function(data) {
          //console.log('DONE: ' + data);
        }
      });
    };
    var changePassword = function(email, oldPassword, newPassword, successCb, errorCb) {
      var obj = {
        Email: email,
        oldPassword: oldPassword,
        newPassword: newPassword
      };
      $.ajax({
        type: 'POST',
        url: castingAddresses.changePasswordUrl,
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json',
        data: JSON.stringify(obj),
        success: function(data) {
          if (typeof successCb == 'function') {
            successCb(data);
          }
        },
        error: function(jqRes, status, error) {
          if (typeof errorCb == 'function') {
            errorCb(jqRes, status, error);
          }
        }
      });
    };
    var retrievePassword = function(email, successCb, errorCb) {
      var obj = {
        user: email
      };
      $.ajax({
        type: 'POST',
        url: castingAddresses.retrievePasswordUrl,
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json',
        data: JSON.stringify(obj),
        success: function(data) {
          if (typeof successCb == 'function') {
            successCb(data);
          }
        },
        error: function(jqRes, status, error) {
          if (typeof errorCb == 'function') {
            errorCb(jqRes, status, error);
          }
        }
      });
    };
    var sendRegistration = function(regData, successCb, errorCb) {
      if (typeof regData === 'undefined') {
        return false;
      }
      $.ajax({
        type: 'POST',
        url: castingAddresses.registration,
        data: JSON.stringify(regData),
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json',
        success: function(data) {
          if (typeof successCb == 'function') {
            successCb(data);
          }
        },
        error: function(jqRes, status, error) {
          if (typeof errorCb == 'function') {
            errorCb(jqRes, status, error);
          }
        }
      });
    };
    var sendProfile = function(regData, successCb, errorCb) {
      if (typeof regData === 'undefined') {
        return false;
      }
      $.ajax({
        type: 'POST',
        url: castingAddresses.sendProfile,
        data: JSON.stringify(regData),
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json',
        success: function(data) {
          if (typeof successCb == 'function') {
            successCb(data);
          }
        },
        error: function(jqRes, status, error) {
          if (typeof errorCb == 'function') {
            errorCb(jqRes, status, error);
          }
        }
      });
    };
    var getValues = function(values, successCb, errorCb) {
      if (typeof values === 'undefined') {
        return false;
      }
      $.ajax({
        type: 'POST',
        url: castingAddresses.getValues,
        data: JSON.stringify(values),
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json',
        success: function(data) {
          if (typeof successCb == 'function') {
            successCb(data);
          }
        },
        error: function(jqRes, status, error) {
          if (typeof errorCb == 'function') {
            errorCb(jqRes, status, error);
          }
        }
      });
    };
    var sendCastingSubmission = function(regData, successCb, errorCb) {
      if (typeof regData === 'undefined') {
        return false;
      }

      $.ajax({
        type: 'POST',
        url: castingAddresses.castingSubmission,
        data: regData,
        mimeType: 'multipart/form-data',
        contentType: false,
        processData: false,
        dataType: 'json',
        success: function(data) {
          if (data.esito === 0) {
            if (typeof successCb == 'function') {
              successCb(data);
            }
          } else {
            //gestire la comparsa di errore
            utils.showAlert('warning', data.descrizione);
            $('form.loading').removeClass('loading');
          }
        },
        error: function(jqRes, status, error) {
          if (typeof errorCb == 'function') {
            errorCb(jqRes, status, error);
          }
        }
      });

    };
    var userMinimumRequirements = function() {
      var res = !!castingUserObject.ua;
      //var res = !!castingUserObject.authToken && !!castingUserObject.ua; // && !!castingUserObject.refreshToken; per gestione modifica profile da app
      //res = document.location.hostname == 'www.raiplay.it' ? res && !!castingUserObject.raiplayId : res;
      return res;
    };
    var isLocalStoragevalid = function() {
      try {
        var testKey = 'raiLocalStorageTest',
          storage = window.localStorage;
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return true;
      } catch (error) {
        return false;
      }
    };
    var getCastingUserObject = function() {
      return getStorage('castingCookie');
    };
    var getYourCasting = function() {
      var castingUserObject = getCastingUserObject();
      return $.ajax({
        method: 'POST',
        url: castingAddresses.yourCasting,
        dataType: 'json',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({
          'idUtente': castingUserObject
        })
      }).then(function(data, txt, jq) {
        return data;
      }, function(jq, st, err) {
        return jq;
      });
    };
    var getYourProfile = function() {
      var castingUserObject = getCastingUserObject();
      return $.ajax({
        method: 'POST',
        url: castingAddresses.yourProfile,
        dataType: 'json',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({
          'idUtente': castingUserObject
        })
      }).then(function(data, txt, jq) {
        return data;
      }, function(jq, st, err) {
        return jq;
      });
    };


    return {
      login: sendLogin,
      checkLogin: checkLogin,
      logout: softLogout,
      registration: sendRegistration,
      changePassword: changePassword,
      retrievePassword: retrievePassword,
      getCastingUserObject: getCastingUserObject,
      castingSubmission: sendCastingSubmission,
      yourCasting: getYourCasting,
      getYourProfile: getYourProfile,
      sendYourProfile: sendProfile,
      getValues: getValues,
      setUserObject : setUserObject
    };
  })();

  var utils = {};

  utils.showAlert = function(style, message) {

    var alert = $("[data-alert]");
    var closeBtn = alert.find("a.close");

    alert.find("span").html(message);
    alert.removeAttr("class");
    alert.addClass("alert-box " + style).removeClass('comparsa');

    closeBtn.click(function(event) {
      event.preventDefault();
      alert.attr("class", "alert-box comparsa");
    });
    utils.scrollToTop();
  };

  utils.scrollToTop = function(){
    var top = $('.containerFiguranti').length > 0 ? $('.containerFiguranti').offset().top - 100 : 0;
    $("html, body").animate({
      scrollTop: top
    }, "slow");
  };

  utils.checkLoginBeforeClick = function(el){
        var obj = $('.'+ el);
        if (!obj.length) return;
        if(checkCastingLogin()){
          methods.getYourProfile().then(function(data){
            if (!data.dati_personali || data.dati_personali.checkDatiPersonali !== true) {
              obj.on('click', function(e){
                e.preventDefault();
                window.location.href = profiloPage + '?avviso';
              });
            }
          });
        }
        else{
          obj.on('click', function(e){
            e.preventDefault();
            window.location.href = loginPage;
          });
        }
  };

  utils.formGenericBehaviors = function(context) {

    context = context || $(this);

    $("input[type=text], input[type=email], input[type=password]", context)
      .focus(function() {
        $(this).parent(".wrapperInput").removeClass('error').find("label").addClass("top");
      })
      .keypress(function() {
        if ($(this).val() !== "") {
          $(this).parent('.wrapperInput').find('.delete').fadeIn('400');
        } else {
          $(this).parent('.wrapperInput').find('.delete').fadeOut('400');
        }
      })
      .blur(function() {
        if ($(this).val() === "") {
          $(this).parent(".wrapperInput").find("label").removeClass("top");
			if ($(this).prop('required')){
			$(this).parent(".wrapperInput").addClass("error");
			}

		}
      });

    $("input[type=number], input[type=date], select", context)
	 .each(function(){
        $(this).parent(".wrapperInput").find("label").addClass("top");
        $(this).find(".delete").remove();

		})
		.focus(function() {
        $(this).parent(".wrapperInput").removeClass('error').find("label").addClass("top");
		})

		.blur(function() {
        if ($(this).val() === "") {

			if ($(this).prop('required')){
			$(this).parent(".wrapperInput").addClass("error");
			}

		}
      });

    $('.delete', context).click(function(e) {
      e.preventDefault();
      $(this).parent(".wrapperInput").find("input").val('');
      $(this).parent('.wrapperInput').find('.delete').fadeOut('400');
      $(this).parent(".wrapperInput").find("label").removeClass("top");
    });

	$("input[name='altri_programmi']").click(function() {
	if ($(this).val() == "0") {
		$(".programmi").addClass("disabled").attr("disabled");
		$("#programmi").attr("required");
		} else {
		$(".programmi").removeClass("disabled");
		$("#programmi").removeAttr("disabled");
		}
	});

    $('#cittadinanza').change(function(){
      if($(this).val() !== 'italiana'){
        $('label[data-original-txt="codice_fiscale"]').removeClass('required');
        $('#codice_fiscale').attr("required", false);
      }
      else {
          $('label[data-original-txt="codice_fiscale"]').addClass('required');
          $('#codice_fiscale').attr("required", true);
      }
    });

    if(context[0].id == 'CastingProfilo' || context[0].id == 'CastingRegistrazione') {
      $('select[name="provincia_residenza"], select[name="provincia_nascita"]').each(function() {
        populateProvince($(this));
      });
      // $('select[name="citta_residenza"], select[name="citta_nascita"]').each(function() {
      //   populateCommunes('Agrigento', $(this));
      // });
      $('select:not([name="provincia_residenza"]):not([name="provincia_nascita"]):not([name="citta_residenza"]):not([name="citta_nascita"]):not([name="cittadinanza"])').each(function() {
        populateOptions($(this), $(this).attr('name'));
      });
    }

    function isTouchDevice() {
        return 'ontouchstart' in document.documentElement;
    }

    if (!isTouchDevice()) {
      $('select[multiple]').on('mousedown', function(e) {
        e.preventDefault();
        var _this = this;
        var st = this.scrollTop;
        e.target.selected = !e.target.selected;
        setTimeout(function(){_this.scrollTop = st;}, 0);
        this.focus();
      });


      $('select[multiple]').mouseover(function(e) {
        e.preventDefault();
      });
    }


  $(function(){
    $(':input[type=number]').on('mousewheel',function(e){ $(this).blur(); });
  });

  };

  $("#Figuranti label[for=file]").parent().css( "margin-bottom", "0" );

  var Views = {};
  Views.ituoicasting = function() {
    if (!checkCastingLogin()) return false;
    methods.yourCasting().then(function(data) {
      if (!data.programmi) return;
      $('<div class="row castingAperti"><div class="small-centered small-12 columns"><h2>I tuoi Casting</h2><div id="ituoicasting-lista" class="row"></div></div></div>').insertBefore('.footer');
      if (data.programmi.length == 0) {$('<div class="row"><div class="small-centered small-12 columns"><p class="text-center"><strong>Non sei ancora iscritto a un casting.</strong><br/> Per farlo clicca sul menu "Casting aperti" e seleziona il casting di tuo interesse.<br/> Clicca "Vai al casting" per iscriverti.<br/><br/><br/></p></div></div>').insertBefore('.footer');}
      data.programmi.map(function(v) {
        //console.log(v);
        var html = '<div class="columns small-12"><h3>' + v.nomeProgramma + '</h3>' + '<p>' + v.descrizioneProgramma + '</p></div>';
        $('#ituoicasting-lista').append(html);
      });
    }, function() {
      console.log('Non è stato possibile recuperare le iscrizioni');
    });
  };

  Views.castingaperti = function() {
    checkYourCasting();
    utils.checkLoginBeforeClick('goCasting');
  };

  Views.homepage = function() {
    checkYourCasting();
      utils.checkLoginBeforeClick('goCasting');
  };

  Views.login = function() {
    var context = $(this).find('form');
    utils.formGenericBehaviors(context);
    $(context).on('submit', function(e) {
      e.preventDefault();
      var activeForm = $(this);
      activeForm.addClass('loading');

      var user = $('[name=user]', context).val();
      var password = $('[name=password]', context).val();

      methods.login(user, password, function(data) {
        //console.log('Esito positivo', data);


         methods.getYourProfile().then(function(data){

            if (data.dati_personali && data.dati_personali.checkDatiPersonali) {
                var person = {
                    Nome: data.dati_personali.nome,
                    Cognome: data.dati_personali.cognome,
                }
                window.localStorage.setItem('userCasting', JSON.stringify(person));
            }
             window.location.href = homePage;
          });





      }, function(data) {
        activeForm.removeClass('loading');
        var msg = data.responseJSON.errors.map(function(err) {
            return err.field + ': ' + err.errorMessage;
        });
        //console.log('Esito negativo', data.responseJSON.errors)
        showAlert('error', msg.join('<br/>'));

      });
    });
  };

  Views.changePassword = function() {
    var context = $(this).find('form');
    utils.formGenericBehaviors(context);
    $(context).on('submit', function(e) {
      e.preventDefault();
      var activeForm = $(this);
      activeForm.addClass('loading');

      var email = $('[name=email]', context).val();
      var oldPassword = $('[name=oldPassword]', context).val();
      var newPassword = $('[name=newPassword]', context).val();

      methods.changePassword(email, oldPassword, newPassword, function(data) {
        if (data.esito == 0) {
          utils.showAlert('success', 'La password è stata modificata correttamente');
        } else {
          utils.showAlert('warning', data.descrizione);
        }
        $('form.loading').removeClass('loading');
      }, function(data) {
        activeForm.removeClass('loading');
        var msg = data.responseJSON.errors.map(function(err) {
          return err.field + ': ' + err.errorMessage;
        });
        //console.log('Esito negativo', data.responseJSON.errors)
        utils.showAlert('error', msg.join('<br/>'));
        $('form.loading').removeClass('loading');
      });
    });
  };

  Views.retrievePassword = function() {
    var context = $(this).find('form');
    utils.formGenericBehaviors(context);
    $(context).on('submit', function(e) {
      e.preventDefault();
      var activeForm = $(this);
      activeForm.addClass('loading');

      var email = $('[name=email]', context).val();

      methods.retrievePassword(email, function(data) {
        if (data.esito == 0) {
          utils.showAlert('success', 'Ti è stata inviata una email, controlla nella casella di posta');
        } else {
          utils.showAlert('warning', data.descrizione);
        }
        activeForm.removeClass('loading');
        $('button[type="submit"]',activeForm).hide();
        $('.afterSubmitLink',activeForm).show();
      }, function(data) {
        activeForm.removeClass('loading');
        var msg = data.responseJSON.errors.map(function(err) {
          return err.field + ': ' + err.errorMessage;
        });
        //console.log('Esito negativo', data.responseJSON.errors)
        utils.showAlert('error', msg.join('<br/>'));
        $('form.loading').removeClass('loading');
      });
    });
  };

  Views.registration = function() {
    var context = $(this).find('form');
    utils.formGenericBehaviors(context);

    $(context).on('submit', function(e) {
      e.preventDefault();
      var activeForm = $(this);
      activeForm.addClass('loading');

      if($('[name="consenso_privacy"][value="true"]:checked').length === 0) {
        utils.showAlert('error', 'È necessario accettare il consenso privacy per poter continuare');
        context.removeClass('loading');
        return false;
      }

      if($('[name="cittadinanza"]').val() === 'italiana' && $('[name="codice_fiscale"]').val() === '') {
        utils.showAlert('error', 'È necessario inserire il codice fiscale');
        context.removeClass('loading');
        return false;
      }

      methods.registration(collectDataRegistration(),
        function(data) {
          if (data.esito == 0) {
            utils.showAlert('success', 'Iscrizione eseguita correttamente');
            $('form.loading').removeClass('loading');

            methods.setUserObject(data, function(){
              setTimeout(function(){
                window.location.href = profiloPage + '?avviso';
              }, 3000);
            });

          } else {
            //gestire la comparsa di errore
            utils.showAlert('warning', data.descrizione);
          }
          $('form.loading').removeClass('loading');
        },
        function(data) {
          activeForm.removeClass('loading');
          var msg = data.responseJSON.errors.map(function(err) {
            return err.field + ': ' + err.errorMessage;
          });
          //console.log('Esito negativo', data.responseJSON.errors)
          utils.showAlert('error', msg.join('<br/>'));
        });
    });
  };

  Views.profile = function() {
    var context = $(this).find('form');

    var url = window.location.href;
    if(url.split("?")[1] == 'avviso') utils.showAlert('warning', 'Per partecipare ai casting devi compilare il tuo profilo');


    methods.getYourProfile().then(function(data) {
      //console.log(data);
      if (!data.dati_personali) return;
      profileObj = data.dati_personali;

      utils.formGenericBehaviors(context);


      $('input, textarea, select[name="cittadinanza"]').each(function(e){
        populateYourProfile(profileObj, this);
      });

      $('textarea[data-altro]').each(function(e){
        if(this.value == '') $(this).hide();
      });

      $('select:not([name="cittadinanza"])').on('populate.end', function(e){
        populateYourProfile(profileObj, e.target);
        if(e.target.name === 'provincia_residenza') {
          if (profileObj.provincia_residenza != ''){
            populateCommunes(profileObj.provincia_residenza, $('select[name=citta_residenza]'));
          }
        }
      });

      $('select').on('populateCommunes.end', function(e){
          populateYourProfile(profileObj, e.target);
      });

      $('select[data-altro]').on('change', function(){
        var note = $('textarea[data-altro="'+$(this).attr('name')+'"]');
        if($(this).find('option[value="Altro"], option[value="altro"]').prop('selected')){
          note.show();
        } else {
          note.val('').hide();
        }
      });
    });


    $(context).on('submit', function(e) {
      e.preventDefault();
      var activeForm = $(this);
      activeForm.addClass('loading');

      methods.sendYourProfile(collectDataProfileSubmission(),
        function(data) {
          //console.log('Esito', data);
          if (data.esito == 0) {
            utils.showAlert('success', 'Dati salvati correttamente');
            $('.consenso.success').fadeIn('800');
            $('.casting').fadeOut('800');

          } else {
            //gestire la comparsa di errore
            utils.showAlert('warning', data.descrizione);
          }
          $('form.loading').removeClass('loading');
        },
        function(data) {
          activeForm.removeClass('loading');
          var msg = data.responseJSON.errors.map(function(err) {
            return err.field + ': ' + err.errorMessage;
          });
          //console.log('Esito negativo', data.responseJSON.errors)
          utils.showAlert('error', msg.join('<br/>'));
        });
    });
  };



  Views.atomicform = function() {
    methods.getYourProfile().then(function(data) {
      //console.log(data);
      if (!data.dati_personali) return;
      if(data.dati_personali.checkDatiPersonali != true) window.location.href = profiloPage + '?avviso';
    });

    var context = $(this);
    utils.formGenericBehaviors(context);
    context.append('<div class="row"><div class="columns small-12 medium-6 medium-offset-3"><button class="expanded large button btnAccessLogin" type="submit">Iscriviti</button></div></div>');

    if($(".button-regolamento").length > 0) {
      context.prepend('<div class="row"><div class="columns small-12 medium-6 medium-offset-3"><span class="notice">Iscrivendomi dichiaro di aver letto integralmente il regolamento del gioco e di approvarlo.</span></div><div class="columns small-12 medium-6 medium-offset-3"><div data-alert="" class="alert-box comparsa" aria-live="assertive" role="alertdialog"><span class="message"></span><a href="#" class="close" aria-label="Close Alert">×</a></div></div></div>');
    } else {
      context.prepend('<div class="row"><div class="columns small-12 medium-6 medium-offset-3"><div data-alert="" class="alert-box comparsa" aria-live="assertive" role="alertdialog"><span class="message"></span><a href="#" class="close" aria-label="Close Alert">×</a></div></div></div>');
    }
    $(context).on('submit', function(e) {
      e.preventDefault();
      var activeForm = $(this);
      activeForm.addClass('loading');

      methods.castingSubmission(collectDataSubmission(),
        function(data) {
          context.parent().prepend('<div class="row"><div class="columns small-12"><div class="request-sent"><h2>Richiesta inviata</h2><p class="text-center"><img src="/dl/components/img/ico-thumb-up.png"/>Grazie<br/>La tua richiesta ha avuto buon esito</p><a class="expanded large button" href="'+castingApertiPage+'">Torna ai casting aperti</a></div></div></div>');
          context.remove();
          $('form.loading').removeClass('loading');
          utils.scrollToTop();
        },
        function(data) {
          activeForm.removeClass('loading');
          var msg = data.responseJSON.errors.map(function(err) {
            return err.field + ': ' + err.errorMessage;
          });
          //console.log('Esito negativo', data.responseJSON.errors)
          utils.showAlert('error', msg.join('<br/>'));
      });
    });
  };

  $(function() {


    var castingForm = {
      login: {
        identifier: 'castingLogin',
        html: '/dl/components/include/casting_login_form.html'
      },
      registration: {
        identifier: 'castingRegistrazione',
        html: '/dl/components/include/casting_registrazione_form.html'
      },
      profile: {
        identifier: 'castingProfilo',
        html: '/dl/components/include/casting_profilo_form.html'
      },
      changePassword: {
        identifier: 'castingModificaPassword',
        html: '/dl/components/include/casting_modifica_password_form.html'
      },
      retrievePassword: {
        identifier: 'castingRecuperaPassword',
        html: '/dl/components/include/casting_recupera_password_form.html'
      }
    };

    var genericPages = {
      'Page-71dbdd57-14a2-4fcb-b004-a582395d6727': 'ituoicasting',
      'Page-27ecf501-00ac-4956-9105-804991f135bb': 'castingaperti',
      'Page-ddb4c36b-8c84-4db3-a6d3-7809bef6e27d': 'homepage'
    };

    var isLogged = checkCastingLogin();
    var page = $('body').attr('id');
    var containerFiguranti = $('.containerFiguranti');
    var formId = containerFiguranti.attr('id');

    $('.withFocus .casting').click(function(e){
        if (!isLogged) {
            e.preventDefault();
            window.location.href = loginPage;
        }
    });

    if (Object.keys(genericPages).indexOf(page) !== -1) {
      if (typeof Views[genericPages[page]] === 'function') {
        Views[genericPages[page]].bind(null, {
          'isLogged': isLogged
        }).call();
        return;
      }
    }

    if (containerFiguranti.length && !formId && !isLogged)
    window.location.href = loginPage;


    if (formId) {

      $.each(castingForm, function(key, value) {
        //Agganciamento alla pagina dell'include relativo
        if (value.identifier == formId) {
          $.ajax({
            url: value.html + '?' + (new Date().getTime()),
            method: 'GET',
            headers: {  'Access-Control-Allow-Origin': '*' },
            crossDomain: true,
          }).done(function(data) {
            $(data).appendTo(containerFiguranti);

            if (typeof Views[key] === 'function') {
              Views[key].bind($('#' + value.identifier), {
                'isLogged': isLogged
              }).call();
              return;
            }
            //castingFormInit(value.identifier);
          });
        }
      });
      return;
    }
    Views['atomicform'].bind($('#Figuranti'), {
      'isLogged': isLogged
    }).call();
  });

  function checkCastingLogin() {
    var userId = methods.checkLogin();
    var currentPageComplete = window.location.href;
    currentPage = currentPageComplete.split("/raicasting/");
    currentPage = '/raicasting/' + currentPage[1];
    if (typeof userId === "string") {
      if (!$('.logout').length) {
        $('.mainMenuContainer ul').append('<li class="PrimoLivello"><a href="#" class="logout" target="_top">Logout</a></li>');


        var utenteCasting = JSON.parse(localStorage.getItem('userCasting'));
        if(utenteCasting) {
            var str = utenteCasting.Nome;
            var matches = str.match(/\b(\w)/g);
            var acronym = matches.join('');
            $('.top-bar').append('<div class="UtenteLoggato"><span>' + acronym + '</span></div>');
        }


        $('.logout').on('click', function() {
          methods.logout();
        });
      }
      $('.mainMenuContainer a[href="' + loginPage + '"]').parent().remove();
      if (currentPage == loginPage || currentPage == registrationPage) window.location.href = homePage;
      return true;

    } else {

      $('.mainMenuContainer a[href="' + profiloPage + '"]').parent().remove();
      $('.mainMenuContainer a[href="' + iTuoiCastingPage + '"]').parent().remove();
      $('.mainMenuContainer a[href="' + modificaPasswordPage + '"]').parent().remove();

      if (accessDeniedPagePages.indexOf(currentPage) !== -1) {
        window.location.href = loginPage;
      }
      return false;
    }
  }

  function populateYourProfile(profileObj, field) {

    var name = $(field).attr('name');

    if ($('input[name="' + name + '"][type="text"], input[name="' + name + '"][type="number"]').length > 0) {
      $('input[name="' + name + '"][type="text"], input[name="' + name + '"][type="number"]').val(profileObj[name]);
    }
    if ($('textarea[name="' + name + '"]').length > 0) {
      if(profileObj[name] != '') {
        $('textarea[name="' + name + '"]').text(profileObj[name]).show();
      }
    }
    if ($('select[name="' + name + '"]').length > 0) {
      if (typeof profileObj[name] === 'object') {
        for (var keySelect in profileObj[name]) {
			$('select[name="' + name + '"] option[value="' + $.trim(profileObj[name][keySelect]) + '"]').attr('selected', 'selected');

        }
      } else {
        $('select[name="' + name + '"] option[value="' + $.trim(profileObj[name]) + '"]').attr('selected', 'selected');


      }
    }
    if ($('input[name="' + name + '"][type="radio"]').length > 0) {
      $('input[name="' + name + '"][type="radio"][value="' + profileObj[name] + '"]').attr('checked', 'checked');
    }
  }

  function collectDataSubmission() {

  /* Il seguente metodo è presente in pagina */
  var validation = validateQuestionForm();
  if(validation.isValid != true) {
    var errMsg = validation.field + ": " + validation.message;
    utils.showAlert('error', errMsg);
    return false;
  }

    var msg = '',
      errors = false;

    var idProgrammaVal = $('[id="idProgramma"]').val();
    var programmaAgruppiVal = $('[id="programmaAGruppi"]').val() == 'True' ? 1 : 0;
    var idGruppoVal = typeof $('[name="figuarante.NomeGruppo"]').val() == 'undefined' ? null : $('[name="figuarante.NomeGruppo"]').val();
    var a = 0,
      b = 0,
      domandeCollection = {},
      allegatiCollection = {},
      figurantiText = $('[type=text]:not([name="figuarante.NomeGruppo"]), [type=number], [type=date]');

    var regData = new FormData();

    regData.append('idUtente', castingUserObject);
    regData.append('idProgramma', idProgrammaVal);
    regData.append('programmaAgruppi', programmaAgruppiVal);

    if (idGruppoVal !== null) regData.append('nomeGruppo', idGruppoVal);



    figurantiText.each(function(index) {
      regData.append('domande[' + a + '].idDomanda', $(this).attr('data-original-txt'));
      regData.append('domande[' + a + '].tipoDomanda', $(this).attr('data-type'));
      regData.append('domande[' + a + '].risposta[0]', $.trim($(this).val()));
      a++;
    });


    $('select').each(function() {
      regData.append('domande[' + a + '].idDomanda', $(this).prev().attr('data-original-txt'));
      regData.append('domande[' + a + '].tipoDomanda', $(this).attr('data-type'));
      var totSelected = $(this).find('option:selected').length;

      $(this).find('option:selected').each(function(n) {
        regData.append('domande[' + a + '].risposta[' + n + ']', this.value);
      });
      a++;
    });

    $('input[type=file]').each(function() {
      if (this.files[0]) {
        regData.append('file', this.files[0]);
      }
    });

    return regData;
  }

  function collectDataProfileSubmission() {

    var msg = '',
      errors = false,
      regData = {};

    regData.id_utente = castingUserObject;
    regData.dati_personali = {};

    $('input[type=text], input[type=number], input[type=radio]:checked, textarea').each(function(index) {
      regData.dati_personali[$(this).attr('data-name')] = this.value;
    });

    $('select').each(function() {
		if ($(this).val()!="")
			regData.dati_personali[$(this).attr('data-name')] = $(this).val();
    });

	console.log(regData);
    return regData;
  }

  function collectDataRegistration() {

    var msg = '',
      errors = false,
      regData = {};

    $('input[type=text], input[type=number], input[type=date], input[type=email], input[type=password], input[type=radio]:checked, textarea').each(function() {
      regData[$(this).attr('data-name')] = this.value;
    });


    $('input[type=date]').each(function() {
      var date;
      if(this.value.indexOf('/') >= 0){
        date = this.value;
      } else {
        date = moment(this.value, 'YYYY-MM-DD').format('DD/MM/YYYY');
      }
      if(date != 'Invalid date') {
        regData[$(this).attr('data-name')] = date;
      }
    });


	$('select').each(function() {
      regData[$(this).attr('data-name')] = $(this).find('option:selected').val();
    });

	return regData;
  }

  function populateProvince(select) {
    var values = {
      'type': 'provincia'
    };
    methods.getValues(values,
      function(data) {
        data.forEach(function(entry) {
          select.append('<option value="' + entry.label + '">' + entry.value + '</option>');
        });
        select.on('change', function() {
          var selectName = $(this).attr('name');
          var communesSelect = (selectName == 'provincia_nascita') ? $('[name="citta_nascita"]') : $('[name="citta_residenza"]');
          var selection=$(this).find('option:selected').val();
          if(!!selection){
            populateCommunes(selection, communesSelect);
          }else{
            communesSelect.find('option:not([disabled],.noChoice)').remove();
          }
        });
        select.trigger('populate.end');
      },
      function(data) {
        console.log('Non è stato possibile caricare le opzioni per ' + select.attr('name'));
      });
  }

  function populateCommunes(value, communesSelect) {
    var values = {
      'type': 'comune',
      'filter': value
    };

    methods.getValues(values,
      function(data) {
        communesSelect.find('option:not([disabled],.noChoice)').remove();
        data.forEach(function(entry) {
          communesSelect.append('<option value="' + entry.label + '">' + entry.value + '</option>');
        });
        communesSelect.trigger('populateCommunes.end');
      },
      function(data) {
        console.log('Non è stato possibile caricare le opzioni per ' + communesSelect.attr('name'));
      });
  }

  function populateOptions(select, type) {
    var values = {
      'type': type
    };
    methods.getValues(values,
      function(data) {
        select.find('option:not([disabled], .noChoice)').remove();
        data.forEach(function(entry) {
          select.append('<option value="' + entry.value  + '">' +  entry.label+ '</option>');
        });
        select.trigger('populate.end');
      },
      function(data) {
        console.log('Non è stato possibile caricare le opzioni per ' + select);
      });
  }

  function checkYourCasting() {
    if (!checkCastingLogin()) return false;
    methods.yourCasting().then(function(data) {
      if (!data.programmi) return;
      data.programmi.map(function(v) {
        //console.log(v);
        $('.row[data-id-casting="' + v.idProgramma + '"]').find("a.goCasting").replaceWith( "<div class='doneCasting'>Iscritto</div>" );
      });
    }, function() {
      console.log('Non è stato possibile controllare le iscrizioni');
    });
  }



}(jQuery, document, window));
