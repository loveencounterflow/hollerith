(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, freeze, get_max_integer, get_required_digits, internals, log_to_base, regex, rpr, type_of, types;

  //===========================================================================================================
  // { encodeBigInt,
  //   decodeBigInt,   } = TMP_require_encode_in_alphabet()
  SFMODULES = require('bricabrac-single-file-modules');

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({debug} = console);

  ({regex} = require('regex'));

  ({Grammar, Token, Lexeme} = require('interlex'));

  types = require('./types');

  ({CFG, Hollerith_typespace} = types);

  ({clean_assign} = SFMODULES.unstable.require_clean_assign());

  ({encode, decode, log_to_base, get_required_digits, get_max_integer} = SFMODULES.unstable.require_anybase());

  ({freeze} = Object);

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    // _max_zpun:     +20
    // _min_nun:      -20
    // _max_idx_digits: 8
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    digitset: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_128_16383 = freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    _max_idx_digits: 2,
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    digitset: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5,
    _max_integer: (128 ** 2) - 1 // 16383
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_10 = freeze({
    uniliterals: 'ÏÐÑ ã äåæ',
    _max_zpun: +3,
    _min_nun: -3,
    _max_idx_digits: 3,
    digitset: '0123456789',
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp = freeze({
    uniliterals: 'N',
    _max_zpun: +0,
    _min_nun: -0,
    _max_idx_digits: 3,
    digitset: '0123456789',
    magnifiers: 'JKLM OPQR',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp2 = freeze({
    uniliterals: 'EFGHIJKLM N OPQRSTUVW',
    _max_zpun: +9,
    _min_nun: -9,
    _max_idx_digits: 3,
    digitset: '0123456789',
    magnifiers: 'ABC XYZ',
    dimension: 3,
    _max_integer: 999
  });

  //-----------------------------------------------------------------------------------------------------------
  // constants = C = constants_128
  constants = C = constants_10;

  //-----------------------------------------------------------------------------------------------------------
  internals = freeze({constants, types});

  //===========================================================================================================
  Hollerith = class Hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var clasz;
      clasz = this.constructor;
      this.cfg = freeze(clasz.validate_and_compile_cfg(cfg));
      this.lexer = this.compile_sortkey_lexer(this.cfg);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    static validate_and_compile_cfg(cfg) {
      /* Validations: */
      /* Derivations: */
      var R, T, _max_idx_digits, hollerith_cfg_template, ref;
      hollerith_cfg_template = {
        blank: '\x20',
        dimension: 5
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      T = new Hollerith_typespace({
        blank: R.blank
      });
      R.digitset = T.digitset.validate(cfg.digitset);
      R._digits_list = T.digitset.data._digits_list;
      R._naught = T.digitset.data._naught;
      R._nova = T.digitset.data._nova;
      R._leading_novas_re = T.digitset.data._leading_novas_re;
      R._base = T.digitset.data._base;
      R.magnifiers = T.magnifiers.validate(cfg.magnifiers);
      R._pmag_list = T.magnifiers.data._pmag_list;
      R._nmag_list = T.magnifiers.data._nmag_list;
      R.uniliterals = T.uniliterals.validate(cfg.uniliterals);
      R._cipher = T.uniliterals.data._cipher;
      R._nuns = T.uniliterals.data._nuns;
      R._zpuns = T.uniliterals.data._zpuns;
      R._nuns_list = T.uniliterals.data._nuns_list;
      R._zpuns_list = T.uniliterals.data._zpuns_list;
      R._min_nun = -R._nuns_list.length;
      R._max_zpun = R._zpuns_list.length - 1;
      R.dimension = T.dimension.validate(cfg.dimension);
      //.......................................................................................................
      _max_idx_digits = Math.min(R._pmag_list.length - 1, (ref = cfg._max_idx_digits) != null ? ref : 2e308);
      R._max_idx_digits = T._max_digits_per_idx_$.validate(_max_idx_digits, R._pmag_list);
      //.......................................................................................................
      if (cfg._max_integer != null) {
        R._max_integer = T._max_integer_$.validate(cfg._max_integer, R._base);
      } else {
        R._max_integer = T.create_max_integer_$({
          _base: R._base,
          digits_numof: R._max_idx_digits
        });
      }
      //.......................................................................................................
      if (R._nmag_list.length < R._max_idx_digits) {
        throw new Error(`Ωhll___1 _max_idx_digits is ${R._max_idx_digits}, but there are only ${R._nmag_list.length} positive magnifiers`);
      } else if (R._nmag_list.length > R._max_idx_digits) {
        R._nmag_list = freeze(R._nmag_list.slice(0, +R._max_idx_digits + 1 || 9e9));
      }
      //.......................................................................................................
      if (R._pmag_list.length < R._max_idx_digits) {
        throw new Error(`Ωhll___3 _max_idx_digits is ${R._max_idx_digits}, but there are only ${R._pmag_list.length} positive magnifiers`);
      } else if (R._pmag_list.length > R._max_idx_digits) {
        R._pmag_list = freeze(R._pmag_list.slice(0, +R._max_idx_digits + 1 || 9e9));
      }
      //.......................................................................................................
      R._pmag = R._pmag_list.join('');
      R._nmag = R._nmag_list.join('');
      R._max_idx_width = R._max_idx_digits + 1;
      R._sortkey_width = R._max_idx_width * R.dimension;
      //.......................................................................................................
      R._min_integer = -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      R._alphabet = T._alphabet.validate((R.digitset + ([...R._nmag_list].reverse().join('')) + R._nuns + R._zpuns + R._pmag).replace(T[CFG].blank_splitter, ''));
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    compile_sortkey_lexer(cfg) {
      var R, _nmag, _nuns, _pmag, _zpuns, all_zero_re, cast_nnum, cast_nun, cast_other, cast_padding, cast_pnum, cast_pun, cast_zero, digitset, first, fit_nnum, fit_nun, fit_other, fit_padding, fit_pnum, fit_pun, fit_zero, max_digit, nmag_letters, nuns_letters, pmag_letters, puns_letters, zero_letters;
      ({_nuns, _zpuns, _nmag, _pmag, digitset} = cfg);
      // _base              = digitset.length
      //.......................................................................................................
      nuns_letters = _nuns;
      puns_letters = _zpuns.slice(1);
      nmag_letters = _nmag.slice(1);
      pmag_letters = _pmag.slice(1);
      zero_letters = _zpuns[0];
      max_digit = digitset.at(-1);
      //.......................................................................................................
      fit_nun = regex`(?<letters> [ ${nuns_letters} ]  )                                  `;
      fit_pun = regex`(?<letters> [ ${puns_letters} ]  )                                  `;
      fit_nnum = regex`(?<letters> [ ${nmag_letters} ]  ) (?<mantissa> [ ${digitset}  ]* ) `;
      fit_pnum = regex`(?<letters> [ ${pmag_letters} ]  ) (?<mantissa> [ ${digitset}  ]* ) `;
      fit_padding = regex`(?<letters> [ ${zero_letters} ]+ ) $                                `;
      fit_zero = regex`(?<letters> [ ${zero_letters} ]  (?= .* [^ ${zero_letters} ] ) )     `;
      fit_other = regex`(?<letters> .                    )                                  `;
      all_zero_re = regex`^ ${zero_letters}+ $`;
      //.......................................................................................................
      cast_nun = function({
          data: d
        }) {
        return d.index = (cfg._nuns.indexOf(d.letters)) - cfg._nuns.length;
      };
      cast_pun = function({
          data: d
        }) {
        return d.index = +cfg._zpuns.indexOf(d.letters);
      };
      cast_nnum = function({
          data: d
        }) {
        var mantissa;
        mantissa = d.mantissa.padStart(cfg._max_idx_digits, max_digit);
        return d.index = (decode(mantissa, digitset)) - cfg._max_integer;
      };
      cast_pnum = function({
          data: d
        }) {
        return d.index = decode(d.mantissa, digitset);
      };
      cast_zero = function({
          data: d
        }) {
        return d.index = 0;
      };
      cast_padding = function({
          data: d,
          source,
          hit
        }) {
        if (source === hit) {
          return d.index = 0;
        }
      };
      cast_other = null;
      //.......................................................................................................
      R = new Grammar({
        emit_signals: false
      });
      first = R.new_level({
        name: 'first'
      });
      first.new_token({
        name: 'nun',
        fit: fit_nun,
        cast: cast_nun
      });
      first.new_token({
        name: 'pun',
        fit: fit_pun,
        cast: cast_pun
      });
      first.new_token({
        name: 'nnum',
        fit: fit_nnum,
        cast: cast_nnum
      });
      first.new_token({
        name: 'pnum',
        fit: fit_pnum,
        cast: cast_pnum
      });
      first.new_token({
        name: 'padding',
        fit: fit_padding,
        cast: cast_padding
      });
      first.new_token({
        name: 'zero',
        fit: fit_zero,
        cast: cast_zero
      });
      first.new_token({
        name: 'other',
        fit: fit_other,
        merge: 'list',
        cast: cast_other
      });
      //.......................................................................................................
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    encode(integer_or_list) {
      var n, type;
      /* TAINT use proper validation */
      if (Array.isArray(integer_or_list)) {
        return ((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = integer_or_list.length; i < len; i++) {
            n = integer_or_list[i];
            results.push(this.encode(n));
          }
          return results;
        }).call(this)).join('');
      }
      //.......................................................................................................
      n = integer_or_list;
      if (!Number.isFinite(n)) {
        type = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
        throw new Error(`Ωhll___4 expected a float, got a ${type}`);
      }
      if (!((this.cfg._min_integer <= n && n <= this.cfg._max_integer))) {
        throw new Error(`Ωhll___5 expected a float between ${this.cfg._min_integer} and ${this.cfg._max_integer}, got ${n}`);
      }
      //.......................................................................................................
      return this.encode_integer(n);
    }

    //---------------------------------------------------------------------------------------------------------
    encode_integer(n) {
      var R;
      if ((0 <= n && n <= this.cfg._max_zpun)) {
        /* NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` */
        //.......................................................................................................
        // Zero or small positive:
        return this.cfg._zpuns.at(n);
      }
      if ((this.cfg._min_nun <= n && n < 0)) {
        //.......................................................................................................
        // Small negative:
        return this.cfg._nuns.at(n);
      }
      //.......................................................................................................
      // Big positive:
      if (n > this.cfg._max_zpun) {
        R = encode(n, this.cfg.digitset);
        return (this.cfg._pmag.at(R.length)) + R;
      }
      //.......................................................................................................
      // Big negative:
      /* NOTE plus one or not plus one?? */
      // R = ( encode ( n + @cfg._max_integer + 1 ), @cfg.digitset )
      R = encode(n + this.cfg._max_integer, this.cfg.digitset);
      if (R.length < this.cfg._max_idx_digits) {
        R = R.padStart(this.cfg._max_idx_digits, this.cfg.digitset.at(0));
      } else {
        R = R.replace(this.cfg._leading_novas_re, '');
      }
      return (this.cfg._nmag.at(R.length)) + R;
    }

    //---------------------------------------------------------------------------------------------------------
    parse(sortkey) {
      var R, data, i, index, len, letters, lexeme, mantissa, name, ref, start, stop;
      R = [];
      ref = this.lexer.scan_to_list(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        lexeme = ref[i];
        ({name, start, stop, data} = lexeme);
        //.....................................................................................................
        ({letters, mantissa, index} = data);
        if ((type_of(letters)) === 'list') {
          letters = letters.join('');
        }
        if (mantissa == null) {
          mantissa = null;
        }
        if (index == null) {
          index = null;
        }
        //.....................................................................................................
        R.push({name, letters, mantissa, index});
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    decode(sortkey) {
      /* TAINT use proper validation */
      var R, i, len, message, ref, type, unit;
      if ((type = type_of(sortkey)) !== 'text') {
        throw new Error(`Ωhll___9 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll__10 expected a non-empty text, got ${rpr(sortkey)}`);
      }
      R = [];
      ref = this.parse(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        unit = ref[i];
        if (unit.name === 'other') {
          message = `Ωhll__11 not a valid sortkey: unable to parse ${rpr(unit.letters)}`;
          if (sortkey !== unit.letters) {
            message += ` in ${rpr(sortkey)}`;
          }
          throw new Error(message);
        }
        if (unit.index != null) {
          R.push(unit.index);
        }
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    decode_integer(n) {
      throw new Error("Ωhll__12 not implemented");
    }

  };

  //===========================================================================================================
  module.exports = (() => {
    var hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383;
    hollerith_10 = new Hollerith(constants_10);
    hollerith_10mvp = new Hollerith(constants_10mvp);
    hollerith_10mvp2 = new Hollerith(constants_10mvp2);
    hollerith_128 = new Hollerith(constants_128);
    hollerith_128_16383 = new Hollerith(constants_128_16383);
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Ozs7O0VBS0EsU0FBQSxHQUE0QixPQUFBLENBQVEsK0JBQVI7O0VBQzVCLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUE7SUFBRSxjQUFBLEVBQWdCO0VBQWxCLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsT0FBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixFQUNFLEtBREYsRUFFRSxNQUZGLENBQUEsR0FFNEIsT0FBQSxDQUFRLFVBQVIsQ0FGNUI7O0VBR0EsS0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjs7RUFDNUIsQ0FBQSxDQUFFLEdBQUYsRUFDRSxtQkFERixDQUFBLEdBQzRCLEtBRDVCOztFQUVBLENBQUEsQ0FBRSxZQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxvQkFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENB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Q3RCLFdBQU8sQ0FDTCxTQURLLEVBRUwsWUFGSyxFQUdMLGVBSEssRUFJTCxnQkFKSyxFQUtMLGFBTEssRUFNTCxtQkFOSyxFQU9MLFNBUEs7RUFOVyxDQUFBO0FBclNwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyB7IGVuY29kZUJpZ0ludCxcbiMgICBkZWNvZGVCaWdJbnQsICAgfSA9IFRNUF9yZXF1aXJlX2VuY29kZV9pbl9hbHBoYWJldCgpXG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xueyBHcmFtbWFyXG4gIFRva2VuXG4gIExleGVtZSAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG50eXBlcyAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi90eXBlcydcbnsgQ0ZHLFxuICBIb2xsZXJpdGhfdHlwZXNwYWNlLCAgfSA9IHR5cGVzXG57IGNsZWFuX2Fzc2lnbiwgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfY2xlYW5fYXNzaWduKClcbnsgZW5jb2RlLFxuICBkZWNvZGUsXG4gIGxvZ190b19iYXNlLFxuICBnZXRfcmVxdWlyZWRfZGlnaXRzLFxuICBnZXRfbWF4X2ludGVnZXIsICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiIMOjIMOkw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnXG4gICMgX21heF96cHVuOiAgICAgKzIwXG4gICMgX21pbl9udW46ICAgICAgLTIwXG4gICMgX21heF9pZHhfZGlnaXRzOiA4XG4gICMjIyAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBkaWdpdHNldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjhfMTYzODMgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICBfbWF4X2lkeF9kaWdpdHM6IDJcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGRpZ2l0c2V0OiAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIG1hZ25pZmllcnM6ICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICA1XG4gIF9tYXhfaW50ZWdlcjogKCAxMjggKiogMiApIC0gMSAjIDE2MzgzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgJ8OPw5DDkSDDoyDDpMOlw6YnXG4gIF9tYXhfenB1bjogICAgICszXG4gIF9taW5fbnVuOiAgICAgIC0zXG4gIF9tYXhfaWR4X2RpZ2l0czogIDNcbiAgZGlnaXRzZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnTidcbiAgX21heF96cHVuOiAgICAgKzBcbiAgX21pbl9udW46ICAgICAgLTBcbiAgX21heF9pZHhfZGlnaXRzOiAgM1xuICBkaWdpdHNldDogICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICdKS0xNIE9QUVInXG4gIGRpbWVuc2lvbjogICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cDIgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICBfbWF4X3pwdW46ICAgICArOVxuICBfbWluX251bjogICAgICAtOVxuICBfbWF4X2lkeF9kaWdpdHM6ICAzXG4gIGRpZ2l0c2V0OiAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgJ0FCQyBYWVonXG4gIGRpbWVuc2lvbjogICAgM1xuICBfbWF4X2ludGVnZXI6IDk5OVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMjhcbmNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTBcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5pbnRlcm5hbHMgPSBmcmVlemUgeyBjb25zdGFudHMsIHR5cGVzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgQGNmZyAgICAgICAgICAgID0gZnJlZXplIGNsYXN6LnZhbGlkYXRlX2FuZF9jb21waWxlX2NmZyBjZmdcbiAgICBAbGV4ZXIgICAgICAgICAgPSBAY29tcGlsZV9zb3J0a2V5X2xleGVyIEBjZmdcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAdmFsaWRhdGVfYW5kX2NvbXBpbGVfY2ZnOiAoIGNmZyApIC0+XG4gICAgIyMjIFZhbGlkYXRpb25zOiAjIyNcbiAgICAjIyMgRGVyaXZhdGlvbnM6ICMjI1xuICAgIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUgPVxuICAgICAgYmxhbms6ICAgICAgICAnXFx4MjAnXG4gICAgICBkaW1lbnNpb246ICAgNVxuICAgIFIgICAgICAgICAgICAgICAgICAgICA9IGNsZWFuX2Fzc2lnbiB7fSwgaG9sbGVyaXRoX2NmZ190ZW1wbGF0ZSwgY2ZnXG4gICAgVCAgICAgICAgICAgICAgICAgICAgID0gbmV3IEhvbGxlcml0aF90eXBlc3BhY2UgeyBibGFuazogUi5ibGFuaywgfVxuICAgIFIuZGlnaXRzZXQgICAgICAgICAgICA9IFQuZGlnaXRzZXQudmFsaWRhdGUgY2ZnLmRpZ2l0c2V0XG4gICAgUi5fZGlnaXRzX2xpc3QgICAgICAgID0gVC5kaWdpdHNldC5kYXRhLl9kaWdpdHNfbGlzdFxuICAgIFIuX25hdWdodCAgICAgICAgICAgICA9IFQuZGlnaXRzZXQuZGF0YS5fbmF1Z2h0XG4gICAgUi5fbm92YSAgICAgICAgICAgICAgID0gVC5kaWdpdHNldC5kYXRhLl9ub3ZhXG4gICAgUi5fbGVhZGluZ19ub3Zhc19yZSAgID0gVC5kaWdpdHNldC5kYXRhLl9sZWFkaW5nX25vdmFzX3JlXG4gICAgUi5fYmFzZSAgICAgICAgICAgICAgID0gVC5kaWdpdHNldC5kYXRhLl9iYXNlXG4gICAgUi5tYWduaWZpZXJzICAgICAgICAgID0gVC5tYWduaWZpZXJzLnZhbGlkYXRlIGNmZy5tYWduaWZpZXJzXG4gICAgUi5fcG1hZ19saXN0ICAgICAgICAgID0gVC5tYWduaWZpZXJzLmRhdGEuX3BtYWdfbGlzdFxuICAgIFIuX25tYWdfbGlzdCAgICAgICAgICA9IFQubWFnbmlmaWVycy5kYXRhLl9ubWFnX2xpc3RcbiAgICBSLnVuaWxpdGVyYWxzICAgICAgICAgPSBULnVuaWxpdGVyYWxzLnZhbGlkYXRlIGNmZy51bmlsaXRlcmFsc1xuICAgIFIuX2NpcGhlciAgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5fY2lwaGVyXG4gICAgUi5fbnVucyAgICAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLl9udW5zXG4gICAgUi5fenB1bnMgICAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLl96cHVuc1xuICAgIFIuX251bnNfbGlzdCAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc19saXN0XG4gICAgUi5fenB1bnNfbGlzdCAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLl96cHVuc19saXN0XG4gICAgUi5fbWluX251biAgICAgICAgICAgICA9IC1SLl9udW5zX2xpc3QubGVuZ3RoXG4gICAgUi5fbWF4X3pwdW4gICAgICAgICAgICA9IFIuX3pwdW5zX2xpc3QubGVuZ3RoIC0gMVxuICAgIFIuZGltZW5zaW9uICAgICAgICAgICA9IFQuZGltZW5zaW9uLnZhbGlkYXRlIGNmZy5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIF9tYXhfaWR4X2RpZ2l0cyAgID0gTWF0aC5taW4gKCBSLl9wbWFnX2xpc3QubGVuZ3RoIC0gMSApLCAoIGNmZy5fbWF4X2lkeF9kaWdpdHMgPyBJbmZpbml0eSApXG4gICAgUi5fbWF4X2lkeF9kaWdpdHMgPSBULl9tYXhfZGlnaXRzX3Blcl9pZHhfJC52YWxpZGF0ZSBfbWF4X2lkeF9kaWdpdHMsIFIuX3BtYWdfbGlzdFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgY2ZnLl9tYXhfaW50ZWdlcj8gIHRoZW4gIFIuX21heF9pbnRlZ2VyICA9IFQuX21heF9pbnRlZ2VyXyQudmFsaWRhdGUgY2ZnLl9tYXhfaW50ZWdlciwgUi5fYmFzZVxuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICBSLl9tYXhfaW50ZWdlciAgPSBULmNyZWF0ZV9tYXhfaW50ZWdlcl8kIHsgX2Jhc2U6IFIuX2Jhc2UsIGRpZ2l0c19udW1vZjogUi5fbWF4X2lkeF9kaWdpdHMsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIFIuX25tYWdfbGlzdC5sZW5ndGggPCBSLl9tYXhfaWR4X2RpZ2l0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18xIF9tYXhfaWR4X2RpZ2l0cyBpcyAje1IuX21heF9pZHhfZGlnaXRzfSwgYnV0IHRoZXJlIGFyZSBvbmx5ICN7Ui5fbm1hZ19saXN0Lmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgZWxzZSBpZiBSLl9ubWFnX2xpc3QubGVuZ3RoID4gUi5fbWF4X2lkeF9kaWdpdHNcbiAgICAgIFIuX25tYWdfbGlzdCA9IGZyZWV6ZSBSLl9ubWFnX2xpc3RbIC4uIFIuX21heF9pZHhfZGlnaXRzIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIFIuX3BtYWdfbGlzdC5sZW5ndGggPCBSLl9tYXhfaWR4X2RpZ2l0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18zIF9tYXhfaWR4X2RpZ2l0cyBpcyAje1IuX21heF9pZHhfZGlnaXRzfSwgYnV0IHRoZXJlIGFyZSBvbmx5ICN7Ui5fcG1hZ19saXN0Lmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgZWxzZSBpZiBSLl9wbWFnX2xpc3QubGVuZ3RoID4gUi5fbWF4X2lkeF9kaWdpdHNcbiAgICAgIFIuX3BtYWdfbGlzdCA9IGZyZWV6ZSBSLl9wbWFnX2xpc3RbIC4uIFIuX21heF9pZHhfZGlnaXRzIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuX3BtYWcgICAgICAgICAgICAgICA9IFIuX3BtYWdfbGlzdC5qb2luICcnXG4gICAgUi5fbm1hZyAgICAgICAgICAgICAgID0gUi5fbm1hZ19saXN0LmpvaW4gJydcbiAgICBSLl9tYXhfaWR4X3dpZHRoICAgICAgPSBSLl9tYXhfaWR4X2RpZ2l0cyArIDFcbiAgICBSLl9zb3J0a2V5X3dpZHRoICAgICAgPSBSLl9tYXhfaWR4X3dpZHRoICogUi5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuX21pbl9pbnRlZ2VyICAgICAgICA9IC1SLl9tYXhfaW50ZWdlclxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyMjIFRBSU5UIHRoaXMgY2FuIGJlIGdyZWF0bHkgc2ltcGxpZmllZCB3aXRoIFRvIERvcyBpbXBsZW1lbnRlZCAjIyNcbiAgICBSLl9hbHBoYWJldCAgICAgICAgICAgPSBULl9hbHBoYWJldC52YWxpZGF0ZSAoIFIuZGlnaXRzZXQgKyAoIFxcXG4gICAgICBbIFIuX25tYWdfbGlzdC4uLiwgXS5yZXZlcnNlKCkuam9pbiAnJyApICsgXFxcbiAgICAgIFIuX251bnMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgUi5fenB1bnMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFxcXG4gICAgICBSLl9wbWFnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5yZXBsYWNlIFRbQ0ZHXS5ibGFua19zcGxpdHRlciwgJydcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29tcGlsZV9zb3J0a2V5X2xleGVyOiAoIGNmZyApIC0+XG4gICAgeyBfbnVucyxcbiAgICAgIF96cHVucyxcbiAgICAgIF9ubWFnLFxuICAgICAgX3BtYWcsXG4gICAgICBkaWdpdHNldCwgICAgIH0gPSBjZmdcbiAgICAjIF9iYXNlICAgICAgICAgICAgICA9IGRpZ2l0c2V0Lmxlbmd0aFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgbnVuc19sZXR0ZXJzICA9IF9udW5zXG4gICAgcHVuc19sZXR0ZXJzICA9IF96cHVuc1sgIDEgLi4gIF1cbiAgICBubWFnX2xldHRlcnMgID0gX25tYWdbICAgMSAuLiAgXVxuICAgIHBtYWdfbGV0dGVycyAgPSBfcG1hZ1sgICAxIC4uICBdXG4gICAgemVyb19sZXR0ZXJzICA9IF96cHVuc1sgIDAgICAgIF1cbiAgICBtYXhfZGlnaXQgICAgID0gZGlnaXRzZXQuYXQgLTFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZpdF9udW4gICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje251bnNfbGV0dGVyc30gXSAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF9wdW4gICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3B1bnNfbGV0dGVyc30gXSAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF9ubnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje25tYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2RpZ2l0c2V0fSAgXSogKSBcIlxuICAgIGZpdF9wbnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3BtYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2RpZ2l0c2V0fSAgXSogKSBcIlxuICAgIGZpdF9wYWRkaW5nICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3plcm9fbGV0dGVyc30gXSsgKSAkICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF96ZXJvICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3plcm9fbGV0dGVyc30gXSAgKD89IC4qIFteICN7emVyb19sZXR0ZXJzfSBdICkgKSAgICAgXCJcbiAgICBmaXRfb3RoZXIgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IC4gICAgICAgICAgICAgICAgICAgICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBhbGxfemVyb19yZSAgID0gcmVnZXhcIl4gI3t6ZXJvX2xldHRlcnN9KyAkXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNhc3RfbnVuICAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gKCBjZmcuX251bnMuaW5kZXhPZiBkLmxldHRlcnMgKSAtIGNmZy5fbnVucy5sZW5ndGhcbiAgICBjYXN0X3B1biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICtjZmcuX3pwdW5zLmluZGV4T2YgIGQubGV0dGVyc1xuICAgIGNhc3Rfbm51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPlxuICAgICAgbWFudGlzc2EgID0gZC5tYW50aXNzYS5wYWRTdGFydCBjZmcuX21heF9pZHhfZGlnaXRzLCBtYXhfZGlnaXRcbiAgICAgIGQuaW5kZXggICA9ICggZGVjb2RlIG1hbnRpc3NhLCBkaWdpdHNldCApIC0gY2ZnLl9tYXhfaW50ZWdlclxuICAgIGNhc3RfcG51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gZGVjb2RlIGQubWFudGlzc2EsIGRpZ2l0c2V0XG4gICAgY2FzdF96ZXJvICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAwXG4gICAgY2FzdF9wYWRkaW5nICA9ICh7IGRhdGE6IGQsIHNvdXJjZSwgaGl0LCB9KSAtPiBkLmluZGV4ID0gMCBpZiBzb3VyY2UgaXMgaGl0XG4gICAgY2FzdF9vdGhlciAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgID0gbmV3IEdyYW1tYXIgeyBlbWl0X3NpZ25hbHM6IGZhbHNlLCB9XG4gICAgZmlyc3QgICAgICAgPSBSLm5ld19sZXZlbCB7IG5hbWU6ICdmaXJzdCcsIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdudW4nLCAgICAgIGZpdDogZml0X251biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X251biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncHVuJywgICAgICBmaXQ6IGZpdF9wdW4sICAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9wdW4sICAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ25udW0nLCAgICAgZml0OiBmaXRfbm51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3Rfbm51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwbnVtJywgICAgIGZpdDogZml0X3BudW0sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BudW0sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncGFkZGluZycsICBmaXQ6IGZpdF9wYWRkaW5nLCAgICAgICAgICAgICAgY2FzdDogY2FzdF9wYWRkaW5nLCAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3plcm8nLCAgICAgZml0OiBmaXRfemVybywgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfemVybywgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdvdGhlcicsICAgIGZpdDogZml0X290aGVyLCBtZXJnZTogJ2xpc3QnLCBjYXN0OiBjYXN0X290aGVyLCAgICB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlOiAoIGludGVnZXJfb3JfbGlzdCApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICBpZiBBcnJheS5pc0FycmF5IGludGVnZXJfb3JfbGlzdFxuICAgICAgcmV0dXJuICggQGVuY29kZSBuIGZvciBuIGluIGludGVnZXJfb3JfbGlzdCApLmpvaW4gJydcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG4gPSBpbnRlZ2VyX29yX2xpc3RcbiAgICB1bmxlc3MgTnVtYmVyLmlzRmluaXRlIG5cbiAgICAgIHR5cGUgPSAnWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNCBleHBlY3RlZCBhIGZsb2F0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3MgQGNmZy5fbWluX2ludGVnZXIgPD0gbiA8PSBAY2ZnLl9tYXhfaW50ZWdlclxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX181IGV4cGVjdGVkIGEgZmxvYXQgYmV0d2VlbiAje0BjZmcuX21pbl9pbnRlZ2VyfSBhbmQgI3tAY2ZnLl9tYXhfaW50ZWdlcn0sIGdvdCAje259XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBAZW5jb2RlX2ludGVnZXIgblxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlX2ludGVnZXI6ICggbiApIC0+XG4gICAgIyMjIE5PVEUgY2FsbCBvbmx5IHdoZXJlIGFzc3VyZWQgYG5gIGlzIGludGVnZXIgd2l0aGluIG1hZ25pdHVkZSBvZiBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBaZXJvIG9yIHNtYWxsIHBvc2l0aXZlOlxuICAgIHJldHVybiAoIEBjZmcuX3pwdW5zLmF0IG4gKSBpZiAwICAgICAgICAgIDw9IG4gPD0gQGNmZy5fbWF4X3pwdW5cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgU21hbGwgbmVnYXRpdmU6XG4gICAgcmV0dXJuICggQGNmZy5fbnVucy5hdCAgbiApIGlmIEBjZmcuX21pbl9udW4gIDw9IG4gPCAgMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBCaWcgcG9zaXRpdmU6XG4gICAgaWYgbiA+IEBjZmcuX21heF96cHVuXG4gICAgICBSID0gZW5jb2RlIG4sIEBjZmcuZGlnaXRzZXRcbiAgICAgIHJldHVybiAoIEBjZmcuX3BtYWcuYXQgUi5sZW5ndGggKSArIFJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgQmlnIG5lZ2F0aXZlOlxuICAgICMjIyBOT1RFIHBsdXMgb25lIG9yIG5vdCBwbHVzIG9uZT8/ICMjI1xuICAgICMgUiA9ICggZW5jb2RlICggbiArIEBjZmcuX21heF9pbnRlZ2VyICsgMSApLCBAY2ZnLmRpZ2l0c2V0IClcbiAgICBSID0gKCBlbmNvZGUgKCBuICsgQGNmZy5fbWF4X2ludGVnZXIgICAgICksIEBjZmcuZGlnaXRzZXQgKVxuICAgIGlmIFIubGVuZ3RoIDwgQGNmZy5fbWF4X2lkeF9kaWdpdHNcbiAgICAgIFIgPSBSLnBhZFN0YXJ0IEBjZmcuX21heF9pZHhfZGlnaXRzLCBAY2ZnLmRpZ2l0c2V0LmF0IDBcbiAgICBlbHNlXG4gICAgICBSID0gUi5yZXBsYWNlIEBjZmcuX2xlYWRpbmdfbm92YXNfcmUsICcnXG4gICAgcmV0dXJuICggQGNmZy5fbm1hZy5hdCBSLmxlbmd0aCApICsgUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcGFyc2U6ICggc29ydGtleSApIC0+XG4gICAgUiA9IFtdXG4gICAgZm9yIGxleGVtZSBpbiBAbGV4ZXIuc2Nhbl90b19saXN0IHNvcnRrZXlcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGRhdGEsICAgICAgIH0gPSBsZXhlbWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeyBsZXR0ZXJzLFxuICAgICAgICBtYW50aXNzYSxcbiAgICAgICAgaW5kZXgsICAgICAgfSA9IGRhdGFcbiAgICAgIGxldHRlcnMgICAgICAgICA9IGxldHRlcnMuam9pbiAnJyBpZiAoIHR5cGVfb2YgbGV0dGVycyApIGlzICdsaXN0J1xuICAgICAgbWFudGlzc2EgICAgICAgPz0gbnVsbFxuICAgICAgaW5kZXggICAgICAgICAgPz0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLnB1c2ggeyBuYW1lLCBsZXR0ZXJzLCBtYW50aXNzYSwgaW5kZXgsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlOiAoIHNvcnRrZXkgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc29ydGtleSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX185IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIHNvcnRrZXkubGVuZ3RoID4gMFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfXzEwIGV4cGVjdGVkIGEgbm9uLWVtcHR5IHRleHQsIGdvdCAje3JwciBzb3J0a2V5fVwiXG4gICAgUiA9IFtdXG4gICAgZm9yIHVuaXQgaW4gQHBhcnNlIHNvcnRrZXlcbiAgICAgIGlmIHVuaXQubmFtZSBpcyAnb3RoZXInXG4gICAgICAgIG1lc3NhZ2UgICA9IFwizqlobGxfXzExIG5vdCBhIHZhbGlkIHNvcnRrZXk6IHVuYWJsZSB0byBwYXJzZSAje3JwciB1bml0LmxldHRlcnN9XCJcbiAgICAgICAgbWVzc2FnZSAgKz0gXCIgaW4gI3tycHIgc29ydGtleX1cIiBpZiBzb3J0a2V5IGlzbnQgdW5pdC5sZXR0ZXJzXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBtZXNzYWdlXG4gICAgICBSLnB1c2ggdW5pdC5pbmRleCBpZiB1bml0LmluZGV4P1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fMTIgbm90IGltcGxlbWVudGVkXCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGhvbGxlcml0aF8xMCAgICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMFxuICBob2xsZXJpdGhfMTBtdnAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnBcbiAgaG9sbGVyaXRoXzEwbXZwMiAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwMlxuICBob2xsZXJpdGhfMTI4ICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XG4gIGhvbGxlcml0aF8xMjhfMTYzODMgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhfMTYzODNcbiAgcmV0dXJuIHtcbiAgICBIb2xsZXJpdGgsXG4gICAgaG9sbGVyaXRoXzEwLFxuICAgIGhvbGxlcml0aF8xMG12cCxcbiAgICBob2xsZXJpdGhfMTBtdnAyLFxuICAgIGhvbGxlcml0aF8xMjgsXG4gICAgaG9sbGVyaXRoXzEyOF8xNjM4MyxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
