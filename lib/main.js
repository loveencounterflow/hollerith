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
    /*                           1         2         3       */
    /*                  12345678901234567890123456789012     */
    digitset: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_128_16383 = freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    /*                           1         2         3       */
    /*                  12345678901234567890123456789012     */
    digitset: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5,
    max_idx_digits: 2,
    _max_integer: (128 ** 2) - 1 // 16383
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_10 = freeze({
    uniliterals: 'ÏÐÑ ã äåæ',
    digitset: '0123456789',
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp = freeze({
    uniliterals: 'N',
    digitset: '0123456789',
    magnifiers: 'JKLM OPQR',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp2 = freeze({
    uniliterals: 'EFGHIJKLM N OPQRSTUVW',
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
      var R, T, hollerith_cfg_template, ref;
      hollerith_cfg_template = {
        blank: '\x20',
        dimension: 5
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      T = new Hollerith_typespace({
        blank: R.blank
      });
      R.digitset = T.digitset.validate(R.digitset);
      R._digits_list = T.digitset.data._digits_list;
      R._naught = T.digitset.data._naught;
      R._nova = T.digitset.data._nova;
      R._leading_novas_re = T.digitset.data._leading_novas_re;
      R._base = T.digitset.data._base;
      R.magnifiers = T.magnifiers.validate(R.magnifiers);
      R._pmag_list = T.magnifiers.data._pmag_list;
      R._nmag_list = T.magnifiers.data._nmag_list;
      R.uniliterals = T.uniliterals.validate(R.uniliterals);
      R._cipher = T.uniliterals.data._cipher;
      R._nuns = T.uniliterals.data._nuns;
      R._zpuns = T.uniliterals.data._zpuns;
      R._nuns_list = T.uniliterals.data._nuns_list;
      R._zpuns_list = T.uniliterals.data._zpuns_list;
      R._min_nun = -R._nuns_list.length;
      R._max_zpun = R._zpuns_list.length - 1;
      R.dimension = T.dimension.validate(R.dimension);
      //.......................................................................................................
      if (R.max_idx_digits == null) {
        R.max_idx_digits = Math.min(R._pmag_list.length - 1, (ref = R.max_idx_digits) != null ? ref : 2e308);
      }
      R.max_idx_digits = T._max_digits_per_idx_$.validate(R.max_idx_digits, R._pmag_list);
      R._max_integer = T.create_max_integer_$({
        _base: R._base,
        digits_numof: R.max_idx_digits
      });
      //.......................................................................................................
      if (R._nmag_list.length < R.max_idx_digits) {
        throw new Error(`Ωhll___1 max_idx_digits is ${R.max_idx_digits}, but there are only ${R._nmag_list.length} positive magnifiers`);
      } else if (R._nmag_list.length > R.max_idx_digits) {
        R._nmag_list = freeze(R._nmag_list.slice(0, +R.max_idx_digits + 1 || 9e9));
      }
      //.......................................................................................................
      if (R._pmag_list.length < R.max_idx_digits) {
        throw new Error(`Ωhll___3 max_idx_digits is ${R.max_idx_digits}, but there are only ${R._pmag_list.length} positive magnifiers`);
      } else if (R._pmag_list.length > R.max_idx_digits) {
        R._pmag_list = freeze(R._pmag_list.slice(0, +R.max_idx_digits + 1 || 9e9));
      }
      //.......................................................................................................
      R._pmag = R._pmag_list.join('');
      R._nmag = R._nmag_list.join('');
      R._max_idx_width = R.max_idx_digits + 1;
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
        mantissa = d.mantissa.padStart(cfg.max_idx_digits, max_digit);
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
      if ((0 <= n && n <= this.cfg._max_zpun)) { // Zero or small positive
        /* NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` */
        //.......................................................................................................
        return this.cfg._zpuns.at(n);
      }
      if ((this.cfg._min_nun <= n && n < 0)) { // Small negative
        return this.cfg._nuns.at(n);
      }
      //.......................................................................................................
      if (n > this.cfg._max_zpun) { // Big positive
        R = encode(n, this.cfg.digitset);
        return (this.cfg._pmag.at(R.length)) + R;
      }
      //.......................................................................................................
      R = encode(n + this.cfg._max_integer, this.cfg.digitset); // Big negative
      if (R.length < this.cfg.max_idx_digits) {
        R = R.padStart(this.cfg.max_idx_digits, this.cfg.digitset.at(0));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Ozs7O0VBS0EsU0FBQSxHQUE0QixPQUFBLENBQVEsK0JBQVI7O0VBQzVCLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUE7SUFBRSxjQUFBLEVBQWdCO0VBQWxCLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsT0FBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixFQUNFLEtBREYsRUFFRSxNQUZGLENBQUEsR0FFNEIsT0FBQSxDQUFRLFVBQVIsQ0FGNUI7O0VBR0EsS0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjs7RUFDNUIsQ0FBQSxDQUFFLEdBQUYsRUFDRSxtQkFERixDQUFBLEdBQzRCLEtBRDVCOztFQUVBLENBQUEsQ0FBRSxZQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxvQkFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENB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b0MsT0FBQSxLQUFhLElBQUksQ0FBQyxPQUF0RDtZQUFBLE9BQUEsSUFBWSxDQUFBLElBQUEsQ0FBQSxDQUFPLEdBQUEsQ0FBSSxPQUFKLENBQVAsQ0FBQSxFQUFaOztVQUNBLE1BQU0sSUFBSSxLQUFKLENBQVUsT0FBVixFQUhSOztRQUlBLElBQXFCLGtCQUFyQjtVQUFBLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBSSxDQUFDLEtBQVosRUFBQTs7TUFMRjtBQU1BLGFBQU87SUFiRCxDQWxLVjs7O0lBa0xFLGNBQWdCLENBQUUsQ0FBRixDQUFBO01BQ2QsTUFBTSxJQUFJLEtBQUosQ0FBVSwwQkFBVjtJQURROztFQXBMbEIsRUF0RkE7OztFQThRQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3BCLFFBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQTtJQUFFLFlBQUEsR0FBc0IsSUFBSSxTQUFKLENBQWMsWUFBZDtJQUN0QixlQUFBLEdBQXNCLElBQUksU0FBSixDQUFjLGVBQWQ7SUFDdEIsZ0JBQUEsR0FBc0IsSUFBSSxTQUFKLENBQWMsZ0JBQWQ7SUFDdEIsYUFBQSxHQUFzQixJQUFJLFNBQUosQ0FBYyxhQUFkO0lBQ3RCLG1CQUFBLEdBQXNCLElBQUksU0FBSixDQUFjLG1CQUFkO0FBQ3RCLFdBQU8sQ0FDTCxTQURLLEVBRUwsWUFGSyxFQUdMLGVBSEssRUFJTCxnQkFKSyxFQUtMLGFBTEssRUFNTCxtQkFOSyxFQU9MLFNBUEs7RUFOVyxDQUFBO0FBOVFwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyB7IGVuY29kZUJpZ0ludCxcbiMgICBkZWNvZGVCaWdJbnQsICAgfSA9IFRNUF9yZXF1aXJlX2VuY29kZV9pbl9hbHBoYWJldCgpXG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xueyBHcmFtbWFyXG4gIFRva2VuXG4gIExleGVtZSAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG50eXBlcyAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi90eXBlcydcbnsgQ0ZHLFxuICBIb2xsZXJpdGhfdHlwZXNwYWNlLCAgfSA9IHR5cGVzXG57IGNsZWFuX2Fzc2lnbiwgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfY2xlYW5fYXNzaWduKClcbnsgZW5jb2RlLFxuICBkZWNvZGUsXG4gIGxvZ190b19iYXNlLFxuICBnZXRfcmVxdWlyZWRfZGlnaXRzLFxuICBnZXRfbWF4X2ludGVnZXIsICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiIMOjIMOkw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnXG4gICMjIyAgICAgICAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBkaWdpdHNldDogICAgICAgICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICAgICAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjhfMTYzODMgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICAjIyMgICAgICAgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgbWFnbmlmaWVyczogICAgICAgICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcbiAgbWF4X2lkeF9kaWdpdHM6ICAgICAyXG4gIF9tYXhfaW50ZWdlcjogICAgICAgKCAxMjggKiogMiApIC0gMSAjIDE2MzgzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ8OPw5DDkSDDoyDDpMOlw6YnXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ04nXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ0pLTE0gT1BRUidcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwMiA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICdFRkdISUpLTE0gTiBPUFFSU1RVVlcnXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ0FCQyBYWVonXG4gIGRpbWVuc2lvbjogICAgICAgICAgM1xuICBfbWF4X2ludGVnZXI6ICAgICAgIDk5OVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMjhcbmNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTBcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5pbnRlcm5hbHMgPSBmcmVlemUgeyBjb25zdGFudHMsIHR5cGVzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgQGNmZyAgICAgICAgICAgID0gZnJlZXplIGNsYXN6LnZhbGlkYXRlX2FuZF9jb21waWxlX2NmZyBjZmdcbiAgICBAbGV4ZXIgICAgICAgICAgPSBAY29tcGlsZV9zb3J0a2V5X2xleGVyIEBjZmdcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAdmFsaWRhdGVfYW5kX2NvbXBpbGVfY2ZnOiAoIGNmZyApIC0+XG4gICAgIyMjIFZhbGlkYXRpb25zOiAjIyNcbiAgICAjIyMgRGVyaXZhdGlvbnM6ICMjI1xuICAgIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUgPVxuICAgICAgYmxhbms6ICAgICAgICAnXFx4MjAnXG4gICAgICBkaW1lbnNpb246ICAgNVxuICAgIFIgICAgICAgICAgICAgICAgICAgICA9IGNsZWFuX2Fzc2lnbiB7fSwgaG9sbGVyaXRoX2NmZ190ZW1wbGF0ZSwgY2ZnXG4gICAgVCAgICAgICAgICAgICAgICAgICAgID0gbmV3IEhvbGxlcml0aF90eXBlc3BhY2UgeyBibGFuazogUi5ibGFuaywgfVxuICAgIFIuZGlnaXRzZXQgICAgICAgICAgICA9IFQuZGlnaXRzZXQudmFsaWRhdGUgUi5kaWdpdHNldFxuICAgIFIuX2RpZ2l0c19saXN0ICAgICAgICA9IFQuZGlnaXRzZXQuZGF0YS5fZGlnaXRzX2xpc3RcbiAgICBSLl9uYXVnaHQgICAgICAgICAgICAgPSBULmRpZ2l0c2V0LmRhdGEuX25hdWdodFxuICAgIFIuX25vdmEgICAgICAgICAgICAgICA9IFQuZGlnaXRzZXQuZGF0YS5fbm92YVxuICAgIFIuX2xlYWRpbmdfbm92YXNfcmUgICA9IFQuZGlnaXRzZXQuZGF0YS5fbGVhZGluZ19ub3Zhc19yZVxuICAgIFIuX2Jhc2UgICAgICAgICAgICAgICA9IFQuZGlnaXRzZXQuZGF0YS5fYmFzZVxuICAgIFIubWFnbmlmaWVycyAgICAgICAgICA9IFQubWFnbmlmaWVycy52YWxpZGF0ZSBSLm1hZ25pZmllcnNcbiAgICBSLl9wbWFnX2xpc3QgICAgICAgICAgPSBULm1hZ25pZmllcnMuZGF0YS5fcG1hZ19saXN0XG4gICAgUi5fbm1hZ19saXN0ICAgICAgICAgID0gVC5tYWduaWZpZXJzLmRhdGEuX25tYWdfbGlzdFxuICAgIFIudW5pbGl0ZXJhbHMgICAgICAgICA9IFQudW5pbGl0ZXJhbHMudmFsaWRhdGUgUi51bmlsaXRlcmFsc1xuICAgIFIuX2NpcGhlciAgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5fY2lwaGVyXG4gICAgUi5fbnVucyAgICAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLl9udW5zXG4gICAgUi5fenB1bnMgICAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLl96cHVuc1xuICAgIFIuX251bnNfbGlzdCAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc19saXN0XG4gICAgUi5fenB1bnNfbGlzdCAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLl96cHVuc19saXN0XG4gICAgUi5fbWluX251biAgICAgICAgICAgID0gLVIuX251bnNfbGlzdC5sZW5ndGhcbiAgICBSLl9tYXhfenB1biAgICAgICAgICAgPSBSLl96cHVuc19saXN0Lmxlbmd0aCAtIDFcbiAgICBSLmRpbWVuc2lvbiAgICAgICAgICAgPSBULmRpbWVuc2lvbi52YWxpZGF0ZSBSLmRpbWVuc2lvblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUi5tYXhfaWR4X2RpZ2l0cyAgICAgPz0gTWF0aC5taW4gKCBSLl9wbWFnX2xpc3QubGVuZ3RoIC0gMSApLCAoIFIubWF4X2lkeF9kaWdpdHMgPyBJbmZpbml0eSApXG4gICAgUi5tYXhfaWR4X2RpZ2l0cyAgICAgID0gVC5fbWF4X2RpZ2l0c19wZXJfaWR4XyQudmFsaWRhdGUgUi5tYXhfaWR4X2RpZ2l0cywgUi5fcG1hZ19saXN0XG4gICAgUi5fbWF4X2ludGVnZXIgICAgICAgID0gVC5jcmVhdGVfbWF4X2ludGVnZXJfJCB7IF9iYXNlOiBSLl9iYXNlLCBkaWdpdHNfbnVtb2Y6IFIubWF4X2lkeF9kaWdpdHMsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIFIuX25tYWdfbGlzdC5sZW5ndGggPCBSLm1heF9pZHhfZGlnaXRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzEgbWF4X2lkeF9kaWdpdHMgaXMgI3tSLm1heF9pZHhfZGlnaXRzfSwgYnV0IHRoZXJlIGFyZSBvbmx5ICN7Ui5fbm1hZ19saXN0Lmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgZWxzZSBpZiBSLl9ubWFnX2xpc3QubGVuZ3RoID4gUi5tYXhfaWR4X2RpZ2l0c1xuICAgICAgUi5fbm1hZ19saXN0ID0gZnJlZXplIFIuX25tYWdfbGlzdFsgLi4gUi5tYXhfaWR4X2RpZ2l0cyBdXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBSLl9wbWFnX2xpc3QubGVuZ3RoIDwgUi5tYXhfaWR4X2RpZ2l0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18zIG1heF9pZHhfZGlnaXRzIGlzICN7Ui5tYXhfaWR4X2RpZ2l0c30sIGJ1dCB0aGVyZSBhcmUgb25seSAje1IuX3BtYWdfbGlzdC5sZW5ndGh9IHBvc2l0aXZlIG1hZ25pZmllcnNcIlxuICAgIGVsc2UgaWYgUi5fcG1hZ19saXN0Lmxlbmd0aCA+IFIubWF4X2lkeF9kaWdpdHNcbiAgICAgIFIuX3BtYWdfbGlzdCA9IGZyZWV6ZSBSLl9wbWFnX2xpc3RbIC4uIFIubWF4X2lkeF9kaWdpdHMgXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUi5fcG1hZyAgICAgICAgICAgICAgID0gUi5fcG1hZ19saXN0LmpvaW4gJydcbiAgICBSLl9ubWFnICAgICAgICAgICAgICAgPSBSLl9ubWFnX2xpc3Quam9pbiAnJ1xuICAgIFIuX21heF9pZHhfd2lkdGggICAgICA9IFIubWF4X2lkeF9kaWdpdHMgKyAxXG4gICAgUi5fc29ydGtleV93aWR0aCAgICAgID0gUi5fbWF4X2lkeF93aWR0aCAqIFIuZGltZW5zaW9uXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLl9taW5faW50ZWdlciAgICAgICAgPSAtUi5fbWF4X2ludGVnZXJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBUQUlOVCB0aGlzIGNhbiBiZSBncmVhdGx5IHNpbXBsaWZpZWQgd2l0aCBUbyBEb3MgaW1wbGVtZW50ZWQgIyMjXG4gICAgUi5fYWxwaGFiZXQgICAgICAgICAgID0gVC5fYWxwaGFiZXQudmFsaWRhdGUgKCBSLmRpZ2l0c2V0ICsgKCBcXFxuICAgICAgWyBSLl9ubWFnX2xpc3QuLi4sIF0ucmV2ZXJzZSgpLmpvaW4gJycgKSArIFxcXG4gICAgICBSLl9udW5zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgIFIuX3pwdW5zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgUi5fcG1hZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkucmVwbGFjZSBUW0NGR10uYmxhbmtfc3BsaXR0ZXIsICcnXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbXBpbGVfc29ydGtleV9sZXhlcjogKCBjZmcgKSAtPlxuICAgIHsgX251bnMsXG4gICAgICBfenB1bnMsXG4gICAgICBfbm1hZyxcbiAgICAgIF9wbWFnLFxuICAgICAgZGlnaXRzZXQsICAgICB9ID0gY2ZnXG4gICAgIyBfYmFzZSAgICAgICAgICAgICAgPSBkaWdpdHNldC5sZW5ndGhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG51bnNfbGV0dGVycyAgPSBfbnVuc1xuICAgIHB1bnNfbGV0dGVycyAgPSBfenB1bnNbICAxIC4uICBdXG4gICAgbm1hZ19sZXR0ZXJzICA9IF9ubWFnWyAgIDEgLi4gIF1cbiAgICBwbWFnX2xldHRlcnMgID0gX3BtYWdbICAgMSAuLiAgXVxuICAgIHplcm9fbGV0dGVycyAgPSBfenB1bnNbICAwICAgICBdXG4gICAgbWF4X2RpZ2l0ICAgICA9IGRpZ2l0c2V0LmF0IC0xXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmaXRfbnVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tudW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfcHVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twdW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfbm51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tubWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3tkaWdpdHNldH0gIF0qICkgXCJcbiAgICBmaXRfcG51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twbWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3tkaWdpdHNldH0gIF0qICkgXCJcbiAgICBmaXRfcGFkZGluZyAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0rICkgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfemVybyAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0gICg/PSAuKiBbXiAje3plcm9fbGV0dGVyc30gXSApICkgICAgIFwiXG4gICAgZml0X290aGVyICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiAuICAgICAgICAgICAgICAgICAgICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgYWxsX3plcm9fcmUgICA9IHJlZ2V4XCJeICN7emVyb19sZXR0ZXJzfSsgJFwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjYXN0X251biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICggY2ZnLl9udW5zLmluZGV4T2YgZC5sZXR0ZXJzICkgLSBjZmcuX251bnMubGVuZ3RoXG4gICAgY2FzdF9wdW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSArY2ZnLl96cHVucy5pbmRleE9mICBkLmxldHRlcnNcbiAgICBjYXN0X25udW0gICAgID0gKHsgZGF0YTogZCwgfSkgLT5cbiAgICAgIG1hbnRpc3NhICA9IGQubWFudGlzc2EucGFkU3RhcnQgY2ZnLm1heF9pZHhfZGlnaXRzLCBtYXhfZGlnaXRcbiAgICAgIGQuaW5kZXggICA9ICggZGVjb2RlIG1hbnRpc3NhLCBkaWdpdHNldCApIC0gY2ZnLl9tYXhfaW50ZWdlclxuICAgIGNhc3RfcG51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gZGVjb2RlIGQubWFudGlzc2EsIGRpZ2l0c2V0XG4gICAgY2FzdF96ZXJvICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAwXG4gICAgY2FzdF9wYWRkaW5nICA9ICh7IGRhdGE6IGQsIHNvdXJjZSwgaGl0LCB9KSAtPiBkLmluZGV4ID0gMCBpZiBzb3VyY2UgaXMgaGl0XG4gICAgY2FzdF9vdGhlciAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgICAgPSBuZXcgR3JhbW1hciB7IGVtaXRfc2lnbmFsczogZmFsc2UsIH1cbiAgICBmaXJzdCAgICAgICAgID0gUi5uZXdfbGV2ZWwgeyBuYW1lOiAnZmlyc3QnLCB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbnVuJywgICAgICBmaXQ6IGZpdF9udW4sICAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9udW4sICAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3B1bicsICAgICAgZml0OiBmaXRfcHVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcHVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdubnVtJywgICAgIGZpdDogZml0X25udW0sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X25udW0sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncG51bScsICAgICBmaXQ6IGZpdF9wbnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9wbnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BhZGRpbmcnLCAgZml0OiBmaXRfcGFkZGluZywgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcGFkZGluZywgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICd6ZXJvJywgICAgIGZpdDogZml0X3plcm8sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3plcm8sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnb3RoZXInLCAgICBmaXQ6IGZpdF9vdGhlciwgbWVyZ2U6ICdsaXN0JywgY2FzdDogY2FzdF9vdGhlciwgICAgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZTogKCBpbnRlZ2VyX29yX2xpc3QgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgaWYgQXJyYXkuaXNBcnJheSBpbnRlZ2VyX29yX2xpc3RcbiAgICAgIHJldHVybiAoIEBlbmNvZGUgbiBmb3IgbiBpbiBpbnRlZ2VyX29yX2xpc3QgKS5qb2luICcnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBuID0gaW50ZWdlcl9vcl9saXN0XG4gICAgdW5sZXNzIE51bWJlci5pc0Zpbml0ZSBuXG4gICAgICB0eXBlID0gJ1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFgnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzQgZXhwZWN0ZWQgYSBmbG9hdCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIEBjZmcuX21pbl9pbnRlZ2VyIDw9IG4gPD0gQGNmZy5fbWF4X2ludGVnZXJcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNSBleHBlY3RlZCBhIGZsb2F0IGJldHdlZW4gI3tAY2ZnLl9taW5faW50ZWdlcn0gYW5kICN7QGNmZy5fbWF4X2ludGVnZXJ9LCBnb3QgI3tufVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gQGVuY29kZV9pbnRlZ2VyIG5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZV9pbnRlZ2VyOiAoIG4gKSAtPlxuICAgICMjIyBOT1RFIGNhbGwgb25seSB3aGVyZSBhc3N1cmVkIGBuYCBpcyBpbnRlZ2VyIHdpdGhpbiBtYWduaXR1ZGUgb2YgYE51bWJlci5NQVhfU0FGRV9JTlRFR0VSYCAjIyNcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiAoIEBjZmcuX3pwdW5zLmF0IG4gKSBpZiAwICAgICAgICAgICAgICA8PSBuIDw9IEBjZmcuX21heF96cHVuICAjIFplcm8gb3Igc21hbGwgcG9zaXRpdmVcbiAgICByZXR1cm4gKCBAY2ZnLl9udW5zLmF0ICBuICkgaWYgQGNmZy5fbWluX251biAgPD0gbiA8ICAwICAgICAgICAgICAgICAgIyBTbWFsbCBuZWdhdGl2ZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgbiA+IEBjZmcuX21heF96cHVuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgQmlnIHBvc2l0aXZlXG4gICAgICBSID0gZW5jb2RlIG4sIEBjZmcuZGlnaXRzZXRcbiAgICAgIHJldHVybiAoIEBjZmcuX3BtYWcuYXQgUi5sZW5ndGggKSArIFJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgPSAoIGVuY29kZSAoIG4gKyBAY2ZnLl9tYXhfaW50ZWdlciAgICAgKSwgQGNmZy5kaWdpdHNldCApICAgICAgICAgICAjIEJpZyBuZWdhdGl2ZVxuICAgIGlmIFIubGVuZ3RoIDwgQGNmZy5tYXhfaWR4X2RpZ2l0cyB0aGVuIFIgPSBSLnBhZFN0YXJ0IEBjZmcubWF4X2lkeF9kaWdpdHMsIEBjZmcuZGlnaXRzZXQuYXQgMFxuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSID0gUi5yZXBsYWNlIEBjZmcuX2xlYWRpbmdfbm92YXNfcmUsICcnXG4gICAgcmV0dXJuICggQGNmZy5fbm1hZy5hdCBSLmxlbmd0aCApICsgUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcGFyc2U6ICggc29ydGtleSApIC0+XG4gICAgUiA9IFtdXG4gICAgZm9yIGxleGVtZSBpbiBAbGV4ZXIuc2Nhbl90b19saXN0IHNvcnRrZXlcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGRhdGEsICAgICAgIH0gPSBsZXhlbWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeyBsZXR0ZXJzLFxuICAgICAgICBtYW50aXNzYSxcbiAgICAgICAgaW5kZXgsICAgICAgfSA9IGRhdGFcbiAgICAgIGxldHRlcnMgICAgICAgICA9IGxldHRlcnMuam9pbiAnJyBpZiAoIHR5cGVfb2YgbGV0dGVycyApIGlzICdsaXN0J1xuICAgICAgbWFudGlzc2EgICAgICAgPz0gbnVsbFxuICAgICAgaW5kZXggICAgICAgICAgPz0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLnB1c2ggeyBuYW1lLCBsZXR0ZXJzLCBtYW50aXNzYSwgaW5kZXgsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlOiAoIHNvcnRrZXkgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc29ydGtleSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX185IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIHNvcnRrZXkubGVuZ3RoID4gMFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfXzEwIGV4cGVjdGVkIGEgbm9uLWVtcHR5IHRleHQsIGdvdCAje3JwciBzb3J0a2V5fVwiXG4gICAgUiA9IFtdXG4gICAgZm9yIHVuaXQgaW4gQHBhcnNlIHNvcnRrZXlcbiAgICAgIGlmIHVuaXQubmFtZSBpcyAnb3RoZXInXG4gICAgICAgIG1lc3NhZ2UgICA9IFwizqlobGxfXzExIG5vdCBhIHZhbGlkIHNvcnRrZXk6IHVuYWJsZSB0byBwYXJzZSAje3JwciB1bml0LmxldHRlcnN9XCJcbiAgICAgICAgbWVzc2FnZSAgKz0gXCIgaW4gI3tycHIgc29ydGtleX1cIiBpZiBzb3J0a2V5IGlzbnQgdW5pdC5sZXR0ZXJzXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBtZXNzYWdlXG4gICAgICBSLnB1c2ggdW5pdC5pbmRleCBpZiB1bml0LmluZGV4P1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fMTIgbm90IGltcGxlbWVudGVkXCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGhvbGxlcml0aF8xMCAgICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMFxuICBob2xsZXJpdGhfMTBtdnAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnBcbiAgaG9sbGVyaXRoXzEwbXZwMiAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwMlxuICBob2xsZXJpdGhfMTI4ICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XG4gIGhvbGxlcml0aF8xMjhfMTYzODMgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhfMTYzODNcbiAgcmV0dXJuIHtcbiAgICBIb2xsZXJpdGgsXG4gICAgaG9sbGVyaXRoXzEwLFxuICAgIGhvbGxlcml0aF8xMG12cCxcbiAgICBob2xsZXJpdGhfMTBtdnAyLFxuICAgIGhvbGxlcml0aF8xMjgsXG4gICAgaG9sbGVyaXRoXzEyOF8xNjM4MyxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
