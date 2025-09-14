(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, freeze, get_max_integer, get_required_digits, hide, internals, log_to_base, regex, rpr, set_getter, type_of, types;

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

  ({hide, set_getter} = SFMODULES.require_managed_property_tools());

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
    digits_per_idx: 2
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
    digits_per_idx: 3
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
      ({cfg, types} = clasz.validate_and_compile_cfg(cfg));
      this.cfg = freeze(cfg);
      this.lexer = this.compile_sortkey_lexer(this.cfg);
      hide(this, 'types', types);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    static validate_and_compile_cfg(cfg) {
      /* Validations: */
      /* Derivations: */
      var R, hollerith_cfg_template, ref;
      hollerith_cfg_template = {
        blank: '\x20',
        dimension: 5
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      types = new Hollerith_typespace({
        blank: R.blank
      });
      R.digitset = types.digitset.validate(R.digitset);
      R._digits_list = types.digitset.data._digits_list;
      R._naught = types.digitset.data._naught;
      R._nova = types.digitset.data._nova;
      R._leading_novas_re = types.digitset.data._leading_novas_re;
      R._base = types.digitset.data._base;
      R.magnifiers = types.magnifiers.validate(R.magnifiers);
      R._pmag_list = types.magnifiers.data._pmag_list;
      R._nmag_list = types.magnifiers.data._nmag_list;
      R.uniliterals = types.uniliterals.validate(R.uniliterals);
      R._cipher = types.uniliterals.data._cipher;
      R._nuns = types.uniliterals.data._nuns;
      R._zpuns = types.uniliterals.data._zpuns;
      R._nuns_list = types.uniliterals.data._nuns_list;
      R._zpuns_list = types.uniliterals.data._zpuns_list;
      R._min_nun = -R._nuns_list.length;
      R._max_zpun = R._zpuns_list.length - 1;
      R.dimension = types.dimension.validate(R.dimension);
      //.......................................................................................................
      if (R.digits_per_idx == null) {
        R.digits_per_idx = Math.min(R._pmag_list.length - 1, (ref = R.digits_per_idx) != null ? ref : 2e308);
      }
      R.digits_per_idx = types.digits_per_idx.validate(R.digits_per_idx, R._pmag_list);
      R._max_integer = types.create_max_integer({
        _base: R._base,
        digits_per_idx: R.digits_per_idx
      });
      //.......................................................................................................
      if (R._nmag_list.length < R.digits_per_idx) {
        throw new Error(`Ωhll___1 digits_per_idx is ${R.digits_per_idx}, but there are only ${R._nmag_list.length} positive magnifiers`);
      } else if (R._nmag_list.length > R.digits_per_idx) {
        R._nmag_list = freeze(R._nmag_list.slice(0, +R.digits_per_idx + 1 || 9e9));
      }
      //.......................................................................................................
      if (R._pmag_list.length < R.digits_per_idx) {
        throw new Error(`Ωhll___3 digits_per_idx is ${R.digits_per_idx}, but there are only ${R._pmag_list.length} positive magnifiers`);
      } else if (R._pmag_list.length > R.digits_per_idx) {
        R._pmag_list = freeze(R._pmag_list.slice(0, +R.digits_per_idx + 1 || 9e9));
      }
      //.......................................................................................................
      R._pmag = R._pmag_list.join('');
      R._nmag = R._nmag_list.join('');
      R._max_idx_width = R.digits_per_idx + 1;
      R._sortkey_width = R._max_idx_width * R.dimension;
      //.......................................................................................................
      R._min_integer = -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      R._alphabet = types._alphabet.validate((R.digitset + ([...R._nmag_list].reverse().join('')) + R._nuns + R._zpuns + R._pmag).replace(types[CFG].blank_splitter, ''));
      return {
        cfg: R,
        types
      };
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
        mantissa = d.mantissa.padStart(cfg.digits_per_idx, max_digit);
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
    encode(idx_or_vdx) {
      var type;
      /* TAINT use proper validation */
      this.types.idx_or_vdx.validate(idx_or_vdx);
      switch (type = this.types.idx_or_vdx.data.type) {
        case 'idx':
          return this.encode_idx(idx_or_vdx);
        case 'vdx':
          return this._encode_vdx(idx_or_vdx);
      }
      throw new Error(`Ωhll__10 internal error: unknown type ${rpr(type)}`);
    }

    //---------------------------------------------------------------------------------------------------------
    encode_idx(idx) {
      return this._encode_idx(this.types.idx.validate(idx, this.cfg._min_integer, this.cfg._max_integer));
    }

    //---------------------------------------------------------------------------------------------------------
    _encode_idx(idx) {
      var R;
      if ((0 <= idx && idx <= this.cfg._max_zpun)) { // Zero or small positive
        /* NOTE call only where assured `idx` is integer within magnitude of `Number.MAX_SAFE_INTEGER` */
        //.......................................................................................................
        return this.cfg._zpuns.at(idx);
      }
      if ((this.cfg._min_nun <= idx && idx < 0)) { // Small negative
        return this.cfg._nuns.at(idx);
      }
      //.......................................................................................................
      if (idx > this.cfg._max_zpun) { // Big positive
        R = encode(idx, this.cfg.digitset);
        return (this.cfg._pmag.at(R.length)) + R;
      }
      //.......................................................................................................
      R = encode(idx + this.cfg._max_integer, this.cfg.digitset); // Big negative
      if (R.length < this.cfg.digits_per_idx) {
        R = R.padStart(this.cfg.digits_per_idx, this.cfg.digitset.at(0));
      } else {
        R = R.replace(this.cfg._leading_novas_re, '');
      }
      return (this.cfg._nmag.at(R.length)) + R;
    }

    //---------------------------------------------------------------------------------------------------------
    encode_vdx(vdx) {
      return this._encode_vdx(this.types.vdx.validate(vdx));
    }

    //---------------------------------------------------------------------------------------------------------
    _encode_vdx(vdx) {
      var idx;
      return (((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = vdx.length; i < len; i++) {
          idx = vdx[i];
          results.push(this.encode_idx(idx));
        }
        return results;
      }).call(this)).join('')).padEnd(this.cfg._sortkey_width, this.cfg._cipher);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsbUJBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLFdBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTs7Ozs7RUFLQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLEVBQ0UsS0FERixFQUVFLE1BRkYsQ0FBQSxHQUU0QixPQUFBLENBQVEsVUFBUixDQUY1Qjs7RUFHQSxLQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSOztFQUM1QixDQUFBLENBQUUsR0FBRixFQUNFLG1CQURGLENBQUEsR0FDNEIsS0FENUI7O0VBRUEsQ0FBQSxDQUFFLFlBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLG9CQUFuQixDQUFB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S0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDNUMsQ0FBQyxDQUFDLE9BQUYsR0FBd0IsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDNUMsQ0FBQyxDQUFDLEtBQUYsR0FBd0IsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDNUMsQ0FBQyxDQUFDLGlCQUFGLEdBQXdCLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQzVDLENBQUMsQ0FBQyxLQUFGLEdBQXdCLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQzVDLENBQUMsQ0FBQyxVQUFGLEdBQXdCLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBakIsQ0FBMEIsQ0FBQyxDQUFDLFVBQTVCO01BQ3hCLENBQUMsQ0FBQyxVQUFGLEdBQXdCLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO01BQzlDLENBQUMsQ0FBQyxVQUFGLEdBQXdCLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO01BQzlDLENBQUMsQ0FBQyxXQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBbEIsQ0FBMkIsQ0FBQyxDQUFDLFdBQTdCO01BQ3hCLENBQUMsQ0FBQyxPQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxLQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxNQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxVQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxXQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxRQUFGLEdBQXdCLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztNQUN0QyxDQUFDLENBQUMsU0FBRixHQUF3QixDQUFDLENBQUMsV0FB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c0IsSUFBSSxTQUFKLENBQWMsYUFBZDtJQUN0QixtQkFBQSxHQUFzQixJQUFJLFNBQUosQ0FBYyxtQkFBZDtBQUN0QixXQUFPLENBQ0wsU0FESyxFQUVMLFlBRkssRUFHTCxlQUhLLEVBSUwsZ0JBSkssRUFLTCxhQUxLLEVBTUwsbUJBTkssRUFPTCxTQVBLO0VBTlcsQ0FBQTtBQXRScEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBlbmNvZGVCaWdJbnQsXG4jICAgZGVjb2RlQmlnSW50LCAgIH0gPSBUTVBfcmVxdWlyZV9lbmNvZGVfaW5fYWxwaGFiZXQoKVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcbnsgR3JhbW1hclxuICBUb2tlblxuICBMZXhlbWUgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2ludGVybGV4J1xudHlwZXMgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vdHlwZXMnXG57IENGRyxcbiAgSG9sbGVyaXRoX3R5cGVzcGFjZSwgIH0gPSB0eXBlc1xueyBjbGVhbl9hc3NpZ24sICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2NsZWFuX2Fzc2lnbigpXG57IGVuY29kZSxcbiAgZGVjb2RlLFxuICBsb2dfdG9fYmFzZSxcbiAgZ2V0X3JlcXVpcmVkX2RpZ2l0cyxcbiAgZ2V0X21heF9pbnRlZ2VyLCAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9hbnliYXNlKClcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbnsgaGlkZSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjggPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICAjIyMgICAgICAgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgbWFnbmlmaWVyczogICAgICAgICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4XzE2MzgzID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6Igw6Mgw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtydcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG4gIGRpZ2l0c19wZXJfaWR4OiAgICAgMlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICfDj8OQw5Egw6Mgw6TDpcOmJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICdOJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdKS0xNIE9QUVInXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cDIgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdBQkMgWFlaJ1xuICBkaW1lbnNpb246ICAgICAgICAgIDNcbiAgZGlnaXRzX3Blcl9pZHg6ICAgICAzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBjb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEyOFxuY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmludGVybmFscyA9IGZyZWV6ZSB7IGNvbnN0YW50cywgdHlwZXMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvbGxlcml0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICB7IGNmZyxcbiAgICAgIHR5cGVzLCAgICAgIH0gPSBjbGFzei52YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmcgY2ZnXG4gICAgQGNmZyAgICAgICAgICAgID0gZnJlZXplIGNmZ1xuICAgIEBsZXhlciAgICAgICAgICA9IEBjb21waWxlX3NvcnRrZXlfbGV4ZXIgQGNmZ1xuICAgIGhpZGUgQCwgJ3R5cGVzJywgIHR5cGVzXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZhbGlkYXRlX2FuZF9jb21waWxlX2NmZzogKCBjZmcgKSAtPlxuICAgICMjIyBWYWxpZGF0aW9uczogIyMjXG4gICAgIyMjIERlcml2YXRpb25zOiAjIyNcbiAgICBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlID1cbiAgICAgIGJsYW5rOiAgICAgICAgJ1xceDIwJ1xuICAgICAgZGltZW5zaW9uOiAgIDVcbiAgICBSICAgICAgICAgICAgICAgICAgICAgPSBjbGVhbl9hc3NpZ24ge30sIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUsIGNmZ1xuICAgIHR5cGVzICAgICAgICAgICAgICAgICA9IG5ldyBIb2xsZXJpdGhfdHlwZXNwYWNlIHsgYmxhbms6IFIuYmxhbmssIH1cbiAgICBSLmRpZ2l0c2V0ICAgICAgICAgICAgPSB0eXBlcy5kaWdpdHNldC52YWxpZGF0ZSBSLmRpZ2l0c2V0XG4gICAgUi5fZGlnaXRzX2xpc3QgICAgICAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fZGlnaXRzX2xpc3RcbiAgICBSLl9uYXVnaHQgICAgICAgICAgICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9uYXVnaHRcbiAgICBSLl9ub3ZhICAgICAgICAgICAgICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9ub3ZhXG4gICAgUi5fbGVhZGluZ19ub3Zhc19yZSAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fbGVhZGluZ19ub3Zhc19yZVxuICAgIFIuX2Jhc2UgICAgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX2Jhc2VcbiAgICBSLm1hZ25pZmllcnMgICAgICAgICAgPSB0eXBlcy5tYWduaWZpZXJzLnZhbGlkYXRlIFIubWFnbmlmaWVyc1xuICAgIFIuX3BtYWdfbGlzdCAgICAgICAgICA9IHR5cGVzLm1hZ25pZmllcnMuZGF0YS5fcG1hZ19saXN0XG4gICAgUi5fbm1hZ19saXN0ICAgICAgICAgID0gdHlwZXMubWFnbmlmaWVycy5kYXRhLl9ubWFnX2xpc3RcbiAgICBSLnVuaWxpdGVyYWxzICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy52YWxpZGF0ZSBSLnVuaWxpdGVyYWxzXG4gICAgUi5fY2lwaGVyICAgICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fY2lwaGVyXG4gICAgUi5fbnVucyAgICAgICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc1xuICAgIFIuX3pwdW5zICAgICAgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLmRhdGEuX3pwdW5zXG4gICAgUi5fbnVuc19saXN0ICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc19saXN0XG4gICAgUi5fenB1bnNfbGlzdCAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fenB1bnNfbGlzdFxuICAgIFIuX21pbl9udW4gICAgICAgICAgICA9IC1SLl9udW5zX2xpc3QubGVuZ3RoXG4gICAgUi5fbWF4X3pwdW4gICAgICAgICAgID0gUi5fenB1bnNfbGlzdC5sZW5ndGggLSAxXG4gICAgUi5kaW1lbnNpb24gICAgICAgICAgID0gdHlwZXMuZGltZW5zaW9uLnZhbGlkYXRlIFIuZGltZW5zaW9uXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLmRpZ2l0c19wZXJfaWR4ICAgICA/PSBNYXRoLm1pbiAoIFIuX3BtYWdfbGlzdC5sZW5ndGggLSAxICksICggUi5kaWdpdHNfcGVyX2lkeCA/IEluZmluaXR5IClcbiAgICBSLmRpZ2l0c19wZXJfaWR4ICAgICAgPSB0eXBlcy5kaWdpdHNfcGVyX2lkeC52YWxpZGF0ZSBSLmRpZ2l0c19wZXJfaWR4LCBSLl9wbWFnX2xpc3RcbiAgICBSLl9tYXhfaW50ZWdlciAgICAgICAgPSB0eXBlcy5jcmVhdGVfbWF4X2ludGVnZXIgeyBfYmFzZTogUi5fYmFzZSwgZGlnaXRzX3Blcl9pZHg6IFIuZGlnaXRzX3Blcl9pZHgsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIFIuX25tYWdfbGlzdC5sZW5ndGggPCBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzEgZGlnaXRzX3Blcl9pZHggaXMgI3tSLmRpZ2l0c19wZXJfaWR4fSwgYnV0IHRoZXJlIGFyZSBvbmx5ICN7Ui5fbm1hZ19saXN0Lmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgZWxzZSBpZiBSLl9ubWFnX2xpc3QubGVuZ3RoID4gUi5kaWdpdHNfcGVyX2lkeFxuICAgICAgUi5fbm1hZ19saXN0ID0gZnJlZXplIFIuX25tYWdfbGlzdFsgLi4gUi5kaWdpdHNfcGVyX2lkeCBdXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBSLl9wbWFnX2xpc3QubGVuZ3RoIDwgUi5kaWdpdHNfcGVyX2lkeFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18zIGRpZ2l0c19wZXJfaWR4IGlzICN7Ui5kaWdpdHNfcGVyX2lkeH0sIGJ1dCB0aGVyZSBhcmUgb25seSAje1IuX3BtYWdfbGlzdC5sZW5ndGh9IHBvc2l0aXZlIG1hZ25pZmllcnNcIlxuICAgIGVsc2UgaWYgUi5fcG1hZ19saXN0Lmxlbmd0aCA+IFIuZGlnaXRzX3Blcl9pZHhcbiAgICAgIFIuX3BtYWdfbGlzdCA9IGZyZWV6ZSBSLl9wbWFnX2xpc3RbIC4uIFIuZGlnaXRzX3Blcl9pZHggXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUi5fcG1hZyAgICAgICAgICAgICAgID0gUi5fcG1hZ19saXN0LmpvaW4gJydcbiAgICBSLl9ubWFnICAgICAgICAgICAgICAgPSBSLl9ubWFnX2xpc3Quam9pbiAnJ1xuICAgIFIuX21heF9pZHhfd2lkdGggICAgICA9IFIuZGlnaXRzX3Blcl9pZHggKyAxXG4gICAgUi5fc29ydGtleV93aWR0aCAgICAgID0gUi5fbWF4X2lkeF93aWR0aCAqIFIuZGltZW5zaW9uXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLl9taW5faW50ZWdlciAgICAgICAgPSAtUi5fbWF4X2ludGVnZXJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBUQUlOVCB0aGlzIGNhbiBiZSBncmVhdGx5IHNpbXBsaWZpZWQgd2l0aCBUbyBEb3MgaW1wbGVtZW50ZWQgIyMjXG4gICAgUi5fYWxwaGFiZXQgICAgICAgICAgID0gdHlwZXMuX2FscGhhYmV0LnZhbGlkYXRlICggUi5kaWdpdHNldCArICggXFxcbiAgICAgIFsgUi5fbm1hZ19saXN0Li4uLCBdLnJldmVyc2UoKS5qb2luICcnICkgKyBcXFxuICAgICAgUi5fbnVucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFxcXG4gICAgICBSLl96cHVucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgIFIuX3BtYWcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLnJlcGxhY2UgdHlwZXNbQ0ZHXS5ibGFua19zcGxpdHRlciwgJydcbiAgICByZXR1cm4geyBjZmc6IFIsIHR5cGVzLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb21waWxlX3NvcnRrZXlfbGV4ZXI6ICggY2ZnICkgLT5cbiAgICB7IF9udW5zLFxuICAgICAgX3pwdW5zLFxuICAgICAgX25tYWcsXG4gICAgICBfcG1hZyxcbiAgICAgIGRpZ2l0c2V0LCAgICAgfSA9IGNmZ1xuICAgICMgX2Jhc2UgICAgICAgICAgICAgID0gZGlnaXRzZXQubGVuZ3RoXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBudW5zX2xldHRlcnMgID0gX251bnNcbiAgICBwdW5zX2xldHRlcnMgID0gX3pwdW5zWyAgMSAuLiAgXVxuICAgIG5tYWdfbGV0dGVycyAgPSBfbm1hZ1sgICAxIC4uICBdXG4gICAgcG1hZ19sZXR0ZXJzICA9IF9wbWFnWyAgIDEgLi4gIF1cbiAgICB6ZXJvX2xldHRlcnMgID0gX3pwdW5zWyAgMCAgICAgXVxuICAgIG1heF9kaWdpdCAgICAgPSBkaWdpdHNldC5hdCAtMVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZml0X251biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bnVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3B1biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cHVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X25udW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bm1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7ZGlnaXRzZXR9ICBdKiApIFwiXG4gICAgZml0X3BudW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cG1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7ZGlnaXRzZXR9ICBdKiApIFwiXG4gICAgZml0X3BhZGRpbmcgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdKyApICQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3plcm8gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdICAoPz0gLiogW14gI3t6ZXJvX2xldHRlcnN9IF0gKSApICAgICBcIlxuICAgIGZpdF9vdGhlciAgICAgPSByZWdleFwiKD88bGV0dGVycz4gLiAgICAgICAgICAgICAgICAgICAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGFsbF96ZXJvX3JlICAgPSByZWdleFwiXiAje3plcm9fbGV0dGVyc30rICRcIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2FzdF9udW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAoIGNmZy5fbnVucy5pbmRleE9mIGQubGV0dGVycyApIC0gY2ZnLl9udW5zLmxlbmd0aFxuICAgIGNhc3RfcHVuICAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gK2NmZy5fenB1bnMuaW5kZXhPZiAgZC5sZXR0ZXJzXG4gICAgY2FzdF9ubnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+XG4gICAgICBtYW50aXNzYSAgPSBkLm1hbnRpc3NhLnBhZFN0YXJ0IGNmZy5kaWdpdHNfcGVyX2lkeCwgbWF4X2RpZ2l0XG4gICAgICBkLmluZGV4ICAgPSAoIGRlY29kZSBtYW50aXNzYSwgZGlnaXRzZXQgKSAtIGNmZy5fbWF4X2ludGVnZXJcbiAgICBjYXN0X3BudW0gICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9IGRlY29kZSBkLm1hbnRpc3NhLCBkaWdpdHNldFxuICAgIGNhc3RfemVybyAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gMFxuICAgIGNhc3RfcGFkZGluZyAgPSAoeyBkYXRhOiBkLCBzb3VyY2UsIGhpdCwgfSkgLT4gZC5pbmRleCA9IDAgaWYgc291cmNlIGlzIGhpdFxuICAgIGNhc3Rfb3RoZXIgICAgPSBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICAgID0gbmV3IEdyYW1tYXIgeyBlbWl0X3NpZ25hbHM6IGZhbHNlLCB9XG4gICAgZmlyc3QgICAgICAgICA9IFIubmV3X2xldmVsIHsgbmFtZTogJ2ZpcnN0JywgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ251bicsICAgICAgZml0OiBmaXRfbnVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfbnVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwdW4nLCAgICAgIGZpdDogZml0X3B1biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3B1biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbm51bScsICAgICBmaXQ6IGZpdF9ubnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9ubnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BudW0nLCAgICAgZml0OiBmaXRfcG51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcG51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwYWRkaW5nJywgIGZpdDogZml0X3BhZGRpbmcsICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BhZGRpbmcsICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnemVybycsICAgICBmaXQ6IGZpdF96ZXJvLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF96ZXJvLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ290aGVyJywgICAgZml0OiBmaXRfb3RoZXIsIG1lcmdlOiAnbGlzdCcsIGNhc3Q6IGNhc3Rfb3RoZXIsICAgIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGU6ICggaWR4X29yX3ZkeCApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICBAdHlwZXMuaWR4X29yX3ZkeC52YWxpZGF0ZSBpZHhfb3JfdmR4XG4gICAgc3dpdGNoIHR5cGUgPSBAdHlwZXMuaWR4X29yX3ZkeC5kYXRhLnR5cGVcbiAgICAgIHdoZW4gJ2lkeCcgdGhlbiByZXR1cm4gQGVuY29kZV9pZHggIGlkeF9vcl92ZHhcbiAgICAgIHdoZW4gJ3ZkeCcgdGhlbiByZXR1cm4gQF9lbmNvZGVfdmR4IGlkeF9vcl92ZHhcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fMTAgaW50ZXJuYWwgZXJyb3I6IHVua25vd24gdHlwZSAje3JwciB0eXBlfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfaWR4OiAoIGlkeCApIC0+IEBfZW5jb2RlX2lkeCBAdHlwZXMuaWR4LnZhbGlkYXRlIGlkeCwgQGNmZy5fbWluX2ludGVnZXIsIEBjZmcuX21heF9pbnRlZ2VyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZW5jb2RlX2lkeDogKCBpZHggKSAtPlxuICAgICMjIyBOT1RFIGNhbGwgb25seSB3aGVyZSBhc3N1cmVkIGBpZHhgIGlzIGludGVnZXIgd2l0aGluIG1hZ25pdHVkZSBvZiBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuICggQGNmZy5fenB1bnMuYXQgaWR4ICkgaWYgMCAgICAgICAgICAgICAgPD0gaWR4IDw9IEBjZmcuX21heF96cHVuICAjIFplcm8gb3Igc21hbGwgcG9zaXRpdmVcbiAgICByZXR1cm4gKCBAY2ZnLl9udW5zLmF0ICBpZHggKSBpZiBAY2ZnLl9taW5fbnVuICA8PSBpZHggPCAgMCAgICAgICAgICAgICAgICMgU21hbGwgbmVnYXRpdmVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGlkeCA+IEBjZmcuX21heF96cHVuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgQmlnIHBvc2l0aXZlXG4gICAgICBSID0gZW5jb2RlIGlkeCwgQGNmZy5kaWdpdHNldFxuICAgICAgcmV0dXJuICggQGNmZy5fcG1hZy5hdCBSLmxlbmd0aCApICsgUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiA9ICggZW5jb2RlICggaWR4ICsgQGNmZy5fbWF4X2ludGVnZXIgICAgICksIEBjZmcuZGlnaXRzZXQgKSAgICAgICAgICAgIyBCaWcgbmVnYXRpdmVcbiAgICBpZiBSLmxlbmd0aCA8IEBjZmcuZGlnaXRzX3Blcl9pZHggdGhlbiBSID0gUi5wYWRTdGFydCBAY2ZnLmRpZ2l0c19wZXJfaWR4LCBAY2ZnLmRpZ2l0c2V0LmF0IDBcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUiA9IFIucmVwbGFjZSBAY2ZnLl9sZWFkaW5nX25vdmFzX3JlLCAnJ1xuICAgIHJldHVybiAoIEBjZmcuX25tYWcuYXQgUi5sZW5ndGggKSArIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZV92ZHg6ICggdmR4ICkgLT4gQF9lbmNvZGVfdmR4IEB0eXBlcy52ZHgudmFsaWRhdGUgdmR4XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZW5jb2RlX3ZkeDogKCB2ZHggKSAtPiBcXFxuICAgICggKCBAZW5jb2RlX2lkeCBpZHggZm9yIGlkeCBpbiB2ZHggKS5qb2luICcnICkucGFkRW5kIEBjZmcuX3NvcnRrZXlfd2lkdGgsIEBjZmcuX2NpcGhlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcGFyc2U6ICggc29ydGtleSApIC0+XG4gICAgUiA9IFtdXG4gICAgZm9yIGxleGVtZSBpbiBAbGV4ZXIuc2Nhbl90b19saXN0IHNvcnRrZXlcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGRhdGEsICAgICAgIH0gPSBsZXhlbWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeyBsZXR0ZXJzLFxuICAgICAgICBtYW50aXNzYSxcbiAgICAgICAgaW5kZXgsICAgICAgfSA9IGRhdGFcbiAgICAgIGxldHRlcnMgICAgICAgICA9IGxldHRlcnMuam9pbiAnJyBpZiAoIHR5cGVfb2YgbGV0dGVycyApIGlzICdsaXN0J1xuICAgICAgbWFudGlzc2EgICAgICAgPz0gbnVsbFxuICAgICAgaW5kZXggICAgICAgICAgPz0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLnB1c2ggeyBuYW1lLCBsZXR0ZXJzLCBtYW50aXNzYSwgaW5kZXgsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlOiAoIHNvcnRrZXkgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc29ydGtleSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX185IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIHNvcnRrZXkubGVuZ3RoID4gMFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfXzEwIGV4cGVjdGVkIGEgbm9uLWVtcHR5IHRleHQsIGdvdCAje3JwciBzb3J0a2V5fVwiXG4gICAgUiA9IFtdXG4gICAgZm9yIHVuaXQgaW4gQHBhcnNlIHNvcnRrZXlcbiAgICAgIGlmIHVuaXQubmFtZSBpcyAnb3RoZXInXG4gICAgICAgIG1lc3NhZ2UgICA9IFwizqlobGxfXzExIG5vdCBhIHZhbGlkIHNvcnRrZXk6IHVuYWJsZSB0byBwYXJzZSAje3JwciB1bml0LmxldHRlcnN9XCJcbiAgICAgICAgbWVzc2FnZSAgKz0gXCIgaW4gI3tycHIgc29ydGtleX1cIiBpZiBzb3J0a2V5IGlzbnQgdW5pdC5sZXR0ZXJzXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBtZXNzYWdlXG4gICAgICBSLnB1c2ggdW5pdC5pbmRleCBpZiB1bml0LmluZGV4P1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fMTIgbm90IGltcGxlbWVudGVkXCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGhvbGxlcml0aF8xMCAgICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMFxuICBob2xsZXJpdGhfMTBtdnAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnBcbiAgaG9sbGVyaXRoXzEwbXZwMiAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwMlxuICBob2xsZXJpdGhfMTI4ICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XG4gIGhvbGxlcml0aF8xMjhfMTYzODMgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhfMTYzODNcbiAgcmV0dXJuIHtcbiAgICBIb2xsZXJpdGgsXG4gICAgaG9sbGVyaXRoXzEwLFxuICAgIGhvbGxlcml0aF8xMG12cCxcbiAgICBob2xsZXJpdGhfMTBtdnAyLFxuICAgIGhvbGxlcml0aF8xMjgsXG4gICAgaG9sbGVyaXRoXzEyOF8xNjM4MyxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
