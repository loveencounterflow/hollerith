(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, get_max_integer, get_required_digits, internals, log_to_base, regex, rpr, type_of, types;

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

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = Object.freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    // zpun_max:     +20
    // nun_min:      -20
    _max_digits_per_idx: 8,
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_128_16383 = Object.freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    _max_digits_per_idx: 8,
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5,
    _max_integer: (128 ** 2) - 1 // 16383
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_10 = Object.freeze({
    uniliterals: 'ÏÐÑ ã äåæ',
    zpun_max: +3,
    nun_min: -3,
    _max_digits_per_idx: 3,
    alphabet: '0123456789',
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp = Object.freeze({
    uniliterals: 'N',
    zpun_max: +0,
    nun_min: -0,
    _max_digits_per_idx: 3,
    alphabet: '0123456789',
    magnifiers: 'JKLM OPQR',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp2 = Object.freeze({
    uniliterals: 'EFGHIJKLM N OPQRSTUVW',
    zpun_max: +9,
    nun_min: -9,
    _max_digits_per_idx: 3,
    alphabet: '0123456789',
    magnifiers: 'ABC XYZ',
    dimension: 5,
    _max_integer: 999
  });

  //-----------------------------------------------------------------------------------------------------------
  // constants = C = constants_128
  constants = C = constants_10;

  //-----------------------------------------------------------------------------------------------------------
  internals = Object.freeze({constants, types});

  //===========================================================================================================
  Hollerith = class Hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var clasz;
      clasz = this.constructor;
      this.cfg = Object.freeze(clasz.validate_and_compile_cfg(cfg));
      this.lexer = this.compile_sortkey_lexer(this.cfg);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    static validate_and_compile_cfg(cfg) {
      /* Validations: */
      /* Derivations: */
      var R, T, _max_digits_per_idx, hollerith_cfg_template, ref;
      hollerith_cfg_template = {
        blank: '\x20'
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      T = new Hollerith_typespace({
        blank: R.blank
      });
      R.alphabet = T.alphabet.validate(cfg.alphabet);
      R.alphabet_chrs = T.alphabet.data.alphabet_chrs;
      R.niner = T.alphabet.data.niner;
      R.leading_niners_re = T.alphabet.data.leading_niners_re;
      R.base = T.alphabet.data.base;
      R.magnifiers = T.magnifiers.validate(cfg.magnifiers);
      R.pmag = T.magnifiers.data.pmag;
      R.nmag = T.magnifiers.data.nmag;
      R.pmag_chrs = T.magnifiers.data.pmag_chrs;
      R.nmag_chrs = T.magnifiers.data.nmag_chrs;
      R.uniliterals = T.uniliterals.validate(cfg.uniliterals);
      R.nuns = T.uniliterals.data.nuns;
      R.zpuns = T.uniliterals.data.zpuns;
      R.nun_chrs = T.uniliterals.data.nun_chrs;
      R.zpun_chrs = T.uniliterals.data.zpun_chrs;
      R.nun_min = -R.nun_chrs.length;
      R.zpun_max = R.zpun_chrs.length - 1;
      R.dimension = T.dimension.validate(cfg.dimension);
      //.......................................................................................................
      _max_digits_per_idx = Math.min(R.pmag_chrs.length - 1, (ref = cfg._max_digits_per_idx) != null ? ref : 2e308);
      R._max_digits_per_idx = T._max_digits_per_idx_$.validate(_max_digits_per_idx, R.pmag_chrs);
      //.......................................................................................................
      if (cfg._max_integer != null) {
        R._max_integer = T._max_integer_$.validate(cfg._max_integer, R.base);
      } else {
        R._max_integer = T.create_max_integer_$({
          base: R.base,
          digits: R._max_digits_per_idx
        });
      }
      //.......................................................................................................
      R._min_integer = -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      R.TMP_alphabet = T.TMP_alphabet.validate((R.alphabet + ([...R.nmag_chrs].reverse().join('')) + R.nuns + R.zpuns + R.pmag).replace(T[CFG].blank_splitter, ''));
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    compile_sortkey_lexer(cfg) {
      var R, all_zero_re, alphabet, cast_nnum, cast_nun, cast_other, cast_padding, cast_pnum, cast_pun, cast_zero, first, fit_nnum, fit_nun, fit_other, fit_padding, fit_pnum, fit_pun, fit_zero, max_digit, nmag, nmag_letters, nuns, nuns_letters, pmag, pmag_letters, puns_letters, zero_letters, zpuns;
      ({nuns, zpuns, nmag, pmag, alphabet} = cfg);
      // base              = alphabet.length
      //.......................................................................................................
      nuns_letters = nuns;
      puns_letters = zpuns.slice(1);
      nmag_letters = nmag.slice(1);
      pmag_letters = pmag.slice(1);
      zero_letters = zpuns[0];
      max_digit = alphabet.at(-1);
      //.......................................................................................................
      fit_nun = regex`(?<letters> [ ${nuns_letters} ]  )                                  `;
      fit_pun = regex`(?<letters> [ ${puns_letters} ]  )                                  `;
      fit_nnum = regex`(?<letters> [ ${nmag_letters} ]  ) (?<mantissa> [ ${alphabet}  ]* ) `;
      fit_pnum = regex`(?<letters> [ ${pmag_letters} ]  ) (?<mantissa> [ ${alphabet}  ]* ) `;
      fit_padding = regex`(?<letters> [ ${zero_letters} ]+ ) $                                `;
      fit_zero = regex`(?<letters> [ ${zero_letters} ]  (?= .* [^ ${zero_letters} ] ) )     `;
      fit_other = regex`(?<letters> .                    )                                  `;
      all_zero_re = regex`^ ${zero_letters}+ $`;
      //.......................................................................................................
      cast_nun = function({
          data: d
        }) {
        return d.index = (cfg.nuns.indexOf(d.letters)) - cfg.nuns.length;
      };
      cast_pun = function({
          data: d
        }) {
        return d.index = +cfg.zpuns.indexOf(d.letters);
      };
      cast_nnum = function({
          data: d
        }) {
        var mantissa;
        mantissa = d.mantissa.padStart(cfg._max_digits_per_idx, max_digit);
        return d.index = (decode(mantissa, alphabet)) - cfg._max_integer;
      };
      cast_pnum = function({
          data: d
        }) {
        return d.index = decode(d.mantissa, alphabet);
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
        throw new Error(`Ωhll___1 expected a float, got a ${type}`);
      }
      if (!((this.cfg._min_integer <= n && n <= this.cfg._max_integer))) {
        throw new Error(`Ωhll___2 expected a float between ${this.cfg._min_integer} and ${this.cfg._max_integer}, got ${n}`);
      }
      //.......................................................................................................
      return this.encode_integer(n);
    }

    //---------------------------------------------------------------------------------------------------------
    encode_integer(n) {
      var R;
      if ((0 <= n && n <= this.cfg.zpun_max)) {
        /* NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` */
        //.......................................................................................................
        // Zero or small positive:
        return this.cfg.zpuns.at(n);
      }
      if ((this.cfg.nun_min <= n && n < 0)) {
        //.......................................................................................................
        // Small negative:
        return this.cfg.nuns.at(n);
      }
      //.......................................................................................................
      // Big positive:
      if (n > this.cfg.zpun_max) {
        R = encode(n, this.cfg.alphabet);
        return (this.cfg.pmag.at(R.length)) + R;
      }
      //.......................................................................................................
      // Big negative:
      /* NOTE plus one or not plus one?? */
      // R = ( encode ( n + @cfg._max_integer + 1 ), @cfg.alphabet )
      R = encode(n + this.cfg._max_integer, this.cfg.alphabet);
      // debug 'Ωhll___3', { n, R, }
      if (R.length < this.cfg._max_digits_per_idx) {
        R = R.padStart(this.cfg._max_digits_per_idx, this.cfg.alphabet.at(0));
      } else {
        // debug 'Ωhll___4', { n, R, }
        R = R.replace(this.cfg.leading_niners_re, '');
      }
      // debug 'Ωhll___5', { n, R, }
      return (this.cfg.nmag.at(R.length)) + R;
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
        throw new Error(`Ωhll___6 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll___7 expected a non-empty text, got ${rpr(sortkey)}`);
      }
      R = [];
      ref = this.parse(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        unit = ref[i];
        if (unit.name === 'other') {
          message = `Ωhll___8 not a valid sortkey: unable to parse ${rpr(unit.letters)}`;
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
      throw new Error("Ωhll___9 not implemented");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGVBQUEsRUFBQSxtQkFBQSxFQUFBLFNBQUEsRUFBQSxXQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTs7Ozs7RUFLQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLEVBQ0UsS0FERixFQUVFLE1BRkYsQ0FBQSxHQUU0QixPQUFBLENBQVEsVUFBUixDQUY1Qjs7RUFHQSxLQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSOztFQUM1QixDQUFBLENBQUUsR0FBRixFQUNFLG1CQURGLENBQUEsR0FDNEIsS0FENUI7O0VBRUEsQ0FBQSxDQUFFLFlBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLG9CQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLEVB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QUksU0FBSixDQUFjLGFBQWQ7SUFDdEIsbUJBQUEsR0FBc0IsSUFBSSxTQUFKLENBQWMsbUJBQWQ7QUFDdEIsV0FBTyxDQUNMLFNBREssRUFFTCxZQUZLLEVBR0wsZUFISyxFQUlMLGdCQUpLLEVBS0wsYUFMSyxFQU1MLG1CQU5LLEVBT0wsU0FQSztFQU5XLENBQUE7QUF2UnBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIHsgZW5jb2RlQmlnSW50LFxuIyAgIGRlY29kZUJpZ0ludCwgICB9ID0gVE1QX3JlcXVpcmVfZW5jb2RlX2luX2FscGhhYmV0KClcblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2luZ2xlLWZpbGUtbW9kdWxlcydcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IHJlZ2V4LCAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAncmVnZXgnXG57IEdyYW1tYXJcbiAgVG9rZW5cbiAgTGV4ZW1lICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdpbnRlcmxleCdcbnR5cGVzICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL3R5cGVzJ1xueyBDRkcsXG4gIEhvbGxlcml0aF90eXBlc3BhY2UsICB9ID0gdHlwZXNcbnsgY2xlYW5fYXNzaWduLCAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9jbGVhbl9hc3NpZ24oKVxueyBlbmNvZGUsXG4gIGRlY29kZSxcbiAgbG9nX3RvX2Jhc2UsXG4gIGdldF9yZXF1aXJlZF9kaWdpdHMsXG4gIGdldF9tYXhfaW50ZWdlciwgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYW55YmFzZSgpXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4ID0gT2JqZWN0LmZyZWV6ZVxuICB1bmlsaXRlcmFsczogICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiIMOjIMOkw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnXG4gICMgenB1bl9tYXg6ICAgICArMjBcbiAgIyBudW5fbWluOiAgICAgIC0yMFxuICBfbWF4X2RpZ2l0c19wZXJfaWR4OiA4XG4gICMjIyAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBhbHBoYWJldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjhfMTYzODMgPSBPYmplY3QuZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6Igw6Mgw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtydcbiAgX21heF9kaWdpdHNfcGVyX2lkeDogOFxuICAjIyMgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgYWxwaGFiZXQ6ICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgbWFnbmlmaWVyczogICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgIDVcbiAgX21heF9pbnRlZ2VyOiAoIDEyOCAqKiAyICkgLSAxICMgMTYzODNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTAgPSBPYmplY3QuZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgJ8OPw5DDkSDDoyDDpMOlw6YnXG4gIHpwdW5fbWF4OiAgICAgKzNcbiAgbnVuX21pbjogICAgICAtM1xuICBfbWF4X2RpZ2l0c19wZXJfaWR4OiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cCA9IE9iamVjdC5mcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnTidcbiAgenB1bl9tYXg6ICAgICArMFxuICBudW5fbWluOiAgICAgIC0wXG4gIF9tYXhfZGlnaXRzX3Blcl9pZHg6ICAzXG4gIGFscGhhYmV0OiAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgJ0pLTE0gT1BRUidcbiAgZGltZW5zaW9uOiAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwMiA9IE9iamVjdC5mcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICB6cHVuX21heDogICAgICs5XG4gIG51bl9taW46ICAgICAgLTlcbiAgX21heF9kaWdpdHNfcGVyX2lkeDogIDNcbiAgYWxwaGFiZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAnQUJDIFhZWidcbiAgZGltZW5zaW9uOiAgICA1XG4gIF9tYXhfaW50ZWdlcjogOTk5XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBjb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEyOFxuY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBjb25zdGFudHMsIHR5cGVzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgQGNmZyAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSBjbGFzei52YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmcgY2ZnXG4gICAgQGxleGVyICAgICAgICAgID0gQGNvbXBpbGVfc29ydGtleV9sZXhlciBAY2ZnXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZhbGlkYXRlX2FuZF9jb21waWxlX2NmZzogKCBjZmcgKSAtPlxuICAgICMjIyBWYWxpZGF0aW9uczogIyMjXG4gICAgIyMjIERlcml2YXRpb25zOiAjIyNcbiAgICBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlID1cbiAgICAgIGJsYW5rOiAgJ1xceDIwJ1xuICAgIFIgICAgICAgICAgICAgICAgICAgICA9IGNsZWFuX2Fzc2lnbiB7fSwgaG9sbGVyaXRoX2NmZ190ZW1wbGF0ZSwgY2ZnXG4gICAgVCAgICAgICAgICAgICAgICAgICAgID0gbmV3IEhvbGxlcml0aF90eXBlc3BhY2UgeyBibGFuazogUi5ibGFuaywgfVxuICAgIFIuYWxwaGFiZXQgICAgICAgICAgICA9IFQuYWxwaGFiZXQudmFsaWRhdGUgY2ZnLmFscGhhYmV0XG4gICAgUi5hbHBoYWJldF9jaHJzICAgICAgID0gVC5hbHBoYWJldC5kYXRhLmFscGhhYmV0X2NocnNcbiAgICBSLm5pbmVyICAgICAgICAgICAgICAgPSBULmFscGhhYmV0LmRhdGEubmluZXJcbiAgICBSLmxlYWRpbmdfbmluZXJzX3JlICAgPSBULmFscGhhYmV0LmRhdGEubGVhZGluZ19uaW5lcnNfcmVcbiAgICBSLmJhc2UgICAgICAgICAgICAgICAgPSBULmFscGhhYmV0LmRhdGEuYmFzZVxuICAgIFIubWFnbmlmaWVycyAgICAgICAgICA9IFQubWFnbmlmaWVycy52YWxpZGF0ZSBjZmcubWFnbmlmaWVyc1xuICAgIFIucG1hZyAgICAgICAgICAgICAgICA9IFQubWFnbmlmaWVycy5kYXRhLnBtYWdcbiAgICBSLm5tYWcgICAgICAgICAgICAgICAgPSBULm1hZ25pZmllcnMuZGF0YS5ubWFnXG4gICAgUi5wbWFnX2NocnMgICAgICAgICAgID0gVC5tYWduaWZpZXJzLmRhdGEucG1hZ19jaHJzXG4gICAgUi5ubWFnX2NocnMgICAgICAgICAgID0gVC5tYWduaWZpZXJzLmRhdGEubm1hZ19jaHJzXG4gICAgUi51bmlsaXRlcmFscyAgICAgICAgID0gVC51bmlsaXRlcmFscy52YWxpZGF0ZSBjZmcudW5pbGl0ZXJhbHNcbiAgICBSLm51bnMgICAgICAgICAgICAgICAgPSBULnVuaWxpdGVyYWxzLmRhdGEubnVuc1xuICAgIFIuenB1bnMgICAgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS56cHVuc1xuICAgIFIubnVuX2NocnMgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5udW5fY2hyc1xuICAgIFIuenB1bl9jaHJzICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS56cHVuX2NocnNcbiAgICBSLm51bl9taW4gICAgICAgICAgICAgPSAtUi5udW5fY2hycy5sZW5ndGhcbiAgICBSLnpwdW5fbWF4ICAgICAgICAgICAgPSBSLnpwdW5fY2hycy5sZW5ndGggLSAxXG4gICAgUi5kaW1lbnNpb24gICAgICAgICAgID0gVC5kaW1lbnNpb24udmFsaWRhdGUgY2ZnLmRpbWVuc2lvblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgX21heF9kaWdpdHNfcGVyX2lkeCAgID0gTWF0aC5taW4gKCBSLnBtYWdfY2hycy5sZW5ndGggLSAxICksICggY2ZnLl9tYXhfZGlnaXRzX3Blcl9pZHggPyBJbmZpbml0eSApXG4gICAgUi5fbWF4X2RpZ2l0c19wZXJfaWR4ID0gVC5fbWF4X2RpZ2l0c19wZXJfaWR4XyQudmFsaWRhdGUgX21heF9kaWdpdHNfcGVyX2lkeCwgUi5wbWFnX2NocnNcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGNmZy5fbWF4X2ludGVnZXI/ICB0aGVuICBSLl9tYXhfaW50ZWdlciAgPSBULl9tYXhfaW50ZWdlcl8kLnZhbGlkYXRlIGNmZy5fbWF4X2ludGVnZXIsIFIuYmFzZVxuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICBSLl9tYXhfaW50ZWdlciAgPSBULmNyZWF0ZV9tYXhfaW50ZWdlcl8kIHsgYmFzZTogUi5iYXNlLCBkaWdpdHM6IFIuX21heF9kaWdpdHNfcGVyX2lkeCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUi5fbWluX2ludGVnZXIgICAgICAgID0gLVIuX21heF9pbnRlZ2VyXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgVEFJTlQgdGhpcyBjYW4gYmUgZ3JlYXRseSBzaW1wbGlmaWVkIHdpdGggVG8gRG9zIGltcGxlbWVudGVkICMjI1xuICAgIFIuVE1QX2FscGhhYmV0ICA9IFQuVE1QX2FscGhhYmV0LnZhbGlkYXRlICggUi5hbHBoYWJldCArICggXFxcbiAgICAgIFsgUi5ubWFnX2NocnMuLi4sIF0ucmV2ZXJzZSgpLmpvaW4gJycgKSArIFxcXG4gICAgICBSLm51bnMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgUi56cHVucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgIFIucG1hZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkucmVwbGFjZSBUW0NGR10uYmxhbmtfc3BsaXR0ZXIsICcnXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbXBpbGVfc29ydGtleV9sZXhlcjogKCBjZmcgKSAtPlxuICAgIHsgbnVucyxcbiAgICAgIHpwdW5zLFxuICAgICAgbm1hZyxcbiAgICAgIHBtYWcsXG4gICAgICBhbHBoYWJldCwgICAgIH0gPSBjZmdcbiAgICAjIGJhc2UgICAgICAgICAgICAgID0gYWxwaGFiZXQubGVuZ3RoXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBudW5zX2xldHRlcnMgID0gbnVuc1xuICAgIHB1bnNfbGV0dGVycyAgPSB6cHVuc1sgIDEgLi4gIF1cbiAgICBubWFnX2xldHRlcnMgID0gbm1hZ1sgICAxIC4uICBdXG4gICAgcG1hZ19sZXR0ZXJzICA9IHBtYWdbICAgMSAuLiAgXVxuICAgIHplcm9fbGV0dGVycyAgPSB6cHVuc1sgIDAgICAgIF1cbiAgICBtYXhfZGlnaXQgICAgID0gYWxwaGFiZXQuYXQgLTFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZpdF9udW4gICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje251bnNfbGV0dGVyc30gXSAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF9wdW4gICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3B1bnNfbGV0dGVyc30gXSAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF9ubnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje25tYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2FscGhhYmV0fSAgXSogKSBcIlxuICAgIGZpdF9wbnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3BtYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2FscGhhYmV0fSAgXSogKSBcIlxuICAgIGZpdF9wYWRkaW5nICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3plcm9fbGV0dGVyc30gXSsgKSAkICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF96ZXJvICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3plcm9fbGV0dGVyc30gXSAgKD89IC4qIFteICN7emVyb19sZXR0ZXJzfSBdICkgKSAgICAgXCJcbiAgICBmaXRfb3RoZXIgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IC4gICAgICAgICAgICAgICAgICAgICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBhbGxfemVyb19yZSAgID0gcmVnZXhcIl4gI3t6ZXJvX2xldHRlcnN9KyAkXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNhc3RfbnVuICAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gKCBjZmcubnVucy5pbmRleE9mIGQubGV0dGVycyApIC0gY2ZnLm51bnMubGVuZ3RoXG4gICAgY2FzdF9wdW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSArY2ZnLnpwdW5zLmluZGV4T2YgIGQubGV0dGVyc1xuICAgIGNhc3Rfbm51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPlxuICAgICAgbWFudGlzc2EgID0gZC5tYW50aXNzYS5wYWRTdGFydCBjZmcuX21heF9kaWdpdHNfcGVyX2lkeCwgbWF4X2RpZ2l0XG4gICAgICBkLmluZGV4ICAgPSAoIGRlY29kZSBtYW50aXNzYSwgYWxwaGFiZXQgKSAtIGNmZy5fbWF4X2ludGVnZXJcbiAgICBjYXN0X3BudW0gICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9IGRlY29kZSBkLm1hbnRpc3NhLCBhbHBoYWJldFxuICAgIGNhc3RfemVybyAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gMFxuICAgIGNhc3RfcGFkZGluZyAgPSAoeyBkYXRhOiBkLCBzb3VyY2UsIGhpdCwgfSkgLT4gZC5pbmRleCA9IDAgaWYgc291cmNlIGlzIGhpdFxuICAgIGNhc3Rfb3RoZXIgICAgPSBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICA9IG5ldyBHcmFtbWFyIHsgZW1pdF9zaWduYWxzOiBmYWxzZSwgfVxuICAgIGZpcnN0ICAgICAgID0gUi5uZXdfbGV2ZWwgeyBuYW1lOiAnZmlyc3QnLCB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbnVuJywgICAgICBmaXQ6IGZpdF9udW4sICAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9udW4sICAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3B1bicsICAgICAgZml0OiBmaXRfcHVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcHVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdubnVtJywgICAgIGZpdDogZml0X25udW0sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X25udW0sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncG51bScsICAgICBmaXQ6IGZpdF9wbnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9wbnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BhZGRpbmcnLCAgZml0OiBmaXRfcGFkZGluZywgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcGFkZGluZywgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICd6ZXJvJywgICAgIGZpdDogZml0X3plcm8sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3plcm8sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnb3RoZXInLCAgICBmaXQ6IGZpdF9vdGhlciwgbWVyZ2U6ICdsaXN0JywgY2FzdDogY2FzdF9vdGhlciwgICAgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZTogKCBpbnRlZ2VyX29yX2xpc3QgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgaWYgQXJyYXkuaXNBcnJheSBpbnRlZ2VyX29yX2xpc3RcbiAgICAgIHJldHVybiAoIEBlbmNvZGUgbiBmb3IgbiBpbiBpbnRlZ2VyX29yX2xpc3QgKS5qb2luICcnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBuID0gaW50ZWdlcl9vcl9saXN0XG4gICAgdW5sZXNzIE51bWJlci5pc0Zpbml0ZSBuXG4gICAgICB0eXBlID0gJ1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFgnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzEgZXhwZWN0ZWQgYSBmbG9hdCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIEBjZmcuX21pbl9pbnRlZ2VyIDw9IG4gPD0gQGNmZy5fbWF4X2ludGVnZXJcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMiBleHBlY3RlZCBhIGZsb2F0IGJldHdlZW4gI3tAY2ZnLl9taW5faW50ZWdlcn0gYW5kICN7QGNmZy5fbWF4X2ludGVnZXJ9LCBnb3QgI3tufVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gQGVuY29kZV9pbnRlZ2VyIG5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZV9pbnRlZ2VyOiAoIG4gKSAtPlxuICAgICMjIyBOT1RFIGNhbGwgb25seSB3aGVyZSBhc3N1cmVkIGBuYCBpcyBpbnRlZ2VyIHdpdGhpbiBtYWduaXR1ZGUgb2YgYE51bWJlci5NQVhfU0FGRV9JTlRFR0VSYCAjIyNcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgWmVybyBvciBzbWFsbCBwb3NpdGl2ZTpcbiAgICByZXR1cm4gKCBAY2ZnLnpwdW5zLmF0IG4gKSBpZiAwICAgICAgICAgIDw9IG4gPD0gQGNmZy56cHVuX21heFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBTbWFsbCBuZWdhdGl2ZTpcbiAgICByZXR1cm4gKCBAY2ZnLm51bnMuYXQgIG4gKSBpZiBAY2ZnLm51bl9taW4gIDw9IG4gPCAgMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBCaWcgcG9zaXRpdmU6XG4gICAgaWYgbiA+IEBjZmcuenB1bl9tYXhcbiAgICAgIFIgPSBlbmNvZGUgbiwgQGNmZy5hbHBoYWJldFxuICAgICAgcmV0dXJuICggQGNmZy5wbWFnLmF0IFIubGVuZ3RoICkgKyBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIEJpZyBuZWdhdGl2ZTpcbiAgICAjIyMgTk9URSBwbHVzIG9uZSBvciBub3QgcGx1cyBvbmU/PyAjIyNcbiAgICAjIFIgPSAoIGVuY29kZSAoIG4gKyBAY2ZnLl9tYXhfaW50ZWdlciArIDEgKSwgQGNmZy5hbHBoYWJldCApXG4gICAgUiA9ICggZW5jb2RlICggbiArIEBjZmcuX21heF9pbnRlZ2VyICAgICApLCBAY2ZnLmFscGhhYmV0IClcbiAgICAjIGRlYnVnICfOqWhsbF9fXzMnLCB7IG4sIFIsIH1cbiAgICBpZiBSLmxlbmd0aCA8IEBjZmcuX21heF9kaWdpdHNfcGVyX2lkeFxuICAgICAgUiA9IFIucGFkU3RhcnQgQGNmZy5fbWF4X2RpZ2l0c19wZXJfaWR4LCBAY2ZnLmFscGhhYmV0LmF0IDBcbiAgICAgICMgZGVidWcgJ86paGxsX19fNCcsIHsgbiwgUiwgfVxuICAgIGVsc2VcbiAgICAgIFIgPSBSLnJlcGxhY2UgQGNmZy5sZWFkaW5nX25pbmVyc19yZSwgJydcbiAgICAgICMgZGVidWcgJ86paGxsX19fNScsIHsgbiwgUiwgfVxuICAgIHJldHVybiAoIEBjZmcubm1hZy5hdCBSLmxlbmd0aCApICsgUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcGFyc2U6ICggc29ydGtleSApIC0+XG4gICAgUiA9IFtdXG4gICAgZm9yIGxleGVtZSBpbiBAbGV4ZXIuc2Nhbl90b19saXN0IHNvcnRrZXlcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGRhdGEsICAgICAgIH0gPSBsZXhlbWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeyBsZXR0ZXJzLFxuICAgICAgICBtYW50aXNzYSxcbiAgICAgICAgaW5kZXgsICAgICAgfSA9IGRhdGFcbiAgICAgIGxldHRlcnMgICAgICAgICA9IGxldHRlcnMuam9pbiAnJyBpZiAoIHR5cGVfb2YgbGV0dGVycyApIGlzICdsaXN0J1xuICAgICAgbWFudGlzc2EgICAgICAgPz0gbnVsbFxuICAgICAgaW5kZXggICAgICAgICAgPz0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLnB1c2ggeyBuYW1lLCBsZXR0ZXJzLCBtYW50aXNzYSwgaW5kZXgsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlOiAoIHNvcnRrZXkgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc29ydGtleSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX182IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIHNvcnRrZXkubGVuZ3RoID4gMFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX183IGV4cGVjdGVkIGEgbm9uLWVtcHR5IHRleHQsIGdvdCAje3JwciBzb3J0a2V5fVwiXG4gICAgUiA9IFtdXG4gICAgZm9yIHVuaXQgaW4gQHBhcnNlIHNvcnRrZXlcbiAgICAgIGlmIHVuaXQubmFtZSBpcyAnb3RoZXInXG4gICAgICAgIG1lc3NhZ2UgICA9IFwizqlobGxfX184IG5vdCBhIHZhbGlkIHNvcnRrZXk6IHVuYWJsZSB0byBwYXJzZSAje3JwciB1bml0LmxldHRlcnN9XCJcbiAgICAgICAgbWVzc2FnZSAgKz0gXCIgaW4gI3tycHIgc29ydGtleX1cIiBpZiBzb3J0a2V5IGlzbnQgdW5pdC5sZXR0ZXJzXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBtZXNzYWdlXG4gICAgICBSLnB1c2ggdW5pdC5pbmRleCBpZiB1bml0LmluZGV4P1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzkgbm90IGltcGxlbWVudGVkXCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGhvbGxlcml0aF8xMCAgICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMFxuICBob2xsZXJpdGhfMTBtdnAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnBcbiAgaG9sbGVyaXRoXzEwbXZwMiAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwMlxuICBob2xsZXJpdGhfMTI4ICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XG4gIGhvbGxlcml0aF8xMjhfMTYzODMgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhfMTYzODNcbiAgcmV0dXJuIHtcbiAgICBIb2xsZXJpdGgsXG4gICAgaG9sbGVyaXRoXzEwLFxuICAgIGhvbGxlcml0aF8xMG12cCxcbiAgICBob2xsZXJpdGhfMTBtdnAyLFxuICAgIGhvbGxlcml0aF8xMjgsXG4gICAgaG9sbGVyaXRoXzEyOF8xNjM4MyxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
