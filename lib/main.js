(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10_cardinal, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, freeze, get_max_integer, get_required_digits, hide, internals, log_to_base, regex, rpr, set_getter, type_of, types;

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
  constants_10_cardinal = freeze({
    uniliterals: 'EFGHIJKLM N OPQRSTUVW',
    digitset: '0123456789',
    magnifiers: 'ABC XYZ',
    cardinals_only: true, // nonegatives
    dimension: 3,
    digits_per_idx: 3
  });

  //-----------------------------------------------------------------------------------------------------------
  // constants = C = constants_128
  constants = C = constants_10;

  //-----------------------------------------------------------------------------------------------------------
  internals = freeze({constants, constants_128, constants_128_16383, constants_10, constants_10mvp, constants_10mvp2, constants_10_cardinal, types});

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
      var R, hollerith_cfg_template, nmags, nuns, ref;
      hollerith_cfg_template = {
        blank: '\x20',
        dimension: 5,
        cardinals_only: false
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      types = new Hollerith_typespace({
        blank: R.blank
      });
      R.cardinals_only = types.cardinals_only.validate(R.cardinals_only);
      R.digitset = types.digitset.validate(R.digitset);
      R._digits_list = types.digitset.data._digits_list;
      R._naught = types.digitset.data._naught;
      R._nova = types.digitset.data._nova;
      R._leading_novas_re = types.digitset.data._leading_novas_re;
      R._base = types.digitset.data._base;
      R.magnifiers = types.magnifiers.validate(R.magnifiers, {
        cardinals_only: R.cardinals_only
      });
      R._pmag_list = types.magnifiers.data._pmag_list;
      R._nmag_list = types.magnifiers.data._nmag_list;
      R.uniliterals = types.uniliterals.validate(R.uniliterals);
      R._cipher = types.uniliterals.data._cipher;
      R._nuns = types.uniliterals.data._nuns;
      R._zpuns = types.uniliterals.data._zpuns;
      R._nuns_list = types.uniliterals.data._nuns_list;
      R._zpuns_list = types.uniliterals.data._zpuns_list;
      if (R._cipher !== R._zpuns_list[0]) {
        throw new Error(`Ωhll___1 internal error: _cipher ${rpr(R._cipher)} doesn't match _zpuns ${rpr(R._zpuns)}`);
      }
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
      if (!R.cardinals_only) {
        if (R._nmag_list.length < R.digits_per_idx) {
          throw new Error(`Ωhll___2 digits_per_idx is ${R.digits_per_idx}, but there are only ${R._nmag_list.length} positive magnifiers`);
        } else if (R._nmag_list.length > R.digits_per_idx) {
          R._nmag_list = freeze(R._nmag_list.slice(0, +R.digits_per_idx + 1 || 9e9));
        }
      }
      //.......................................................................................................
      if (R._pmag_list.length < R.digits_per_idx) {
        throw new Error(`Ωhll___3 digits_per_idx is ${R.digits_per_idx}, but there are only ${R._pmag_list.length} positive magnifiers`);
      } else if (R._pmag_list.length > R.digits_per_idx) {
        R._pmag_list = freeze(R._pmag_list.slice(0, +R.digits_per_idx + 1 || 9e9));
      }
      //.......................................................................................................
      R._pmag = R._pmag_list.join('');
      R._nmag = R.cardinals_only ? null : R._nmag_list.join('');
      R._max_idx_width = R.digits_per_idx + 1;
      R._sortkey_width = R._max_idx_width * R.dimension;
      //.......................................................................................................
      R._min_integer = -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      nmags = R.cardinals_only ? '' : [...R._nmag_list].reverse().join('');
      nuns = R.cardinals_only ? '' : R._nuns;
      R._alphabet = types._alphabet.validate((R.digitset + nmags + nuns + R._zpuns + R._pmag).replace(types[CFG].blank_splitter, ''));
      return {
        cfg: R,
        types
      };
    }

    //---------------------------------------------------------------------------------------------------------
    compile_sortkey_lexer(cfg) {
      var R, _nmag, _nuns, _pmag, _zpuns, all_zero_re, cast_nnum, cast_nun, cast_other, cast_padding, cast_pnum, cast_pun, cast_zero, digitset, first, fit_nnum, fit_nun, fit_other, fit_padding, fit_pnum, fit_pun, fit_zero, include_negatives, max_digit, nmag_letters, nuns_letters, pmag_letters, puns_letters, zero_letters;
      ({_nuns, _zpuns, _nmag, _pmag, digitset} = cfg);
      // _base              = digitset.length
      include_negatives = !cfg.cardinals_only;
      //.......................................................................................................
      puns_letters = _zpuns.slice(1);
      pmag_letters = _pmag.slice(1);
      zero_letters = _zpuns[0];
      max_digit = digitset.at(-1);
      //.......................................................................................................
      fit_pun = regex`(?<letters> [ ${puns_letters} ]  )                                  `;
      fit_pnum = regex`(?<letters> [ ${pmag_letters} ]  ) (?<mantissa> [ ${digitset}  ]* ) `;
      fit_padding = regex`(?<letters> [ ${zero_letters} ]+ ) $                                `;
      fit_zero = regex`(?<letters> [ ${zero_letters} ]  (?= .* [^ ${zero_letters} ] ) )     `;
      fit_other = regex`(?<letters> .                    )                                  `;
      all_zero_re = regex`^ ${zero_letters}+ $`;
      //.......................................................................................................
      cast_pun = function({
          data: d
        }) {
        return d.index = +cfg._zpuns.indexOf(d.letters);
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
      if (include_negatives) {
        nuns_letters = _nuns;
        nmag_letters = _nmag.slice(1);
        fit_nun = regex`(?<letters> [ ${nuns_letters} ]  )                                  `;
        fit_nnum = regex`(?<letters> [ ${nmag_letters} ]  ) (?<mantissa> [ ${digitset}  ]* ) `;
        cast_nun = function({
            data: d
          }) {
          return d.index = (cfg._nuns.indexOf(d.letters)) - cfg._nuns.length;
        };
        cast_nnum = function({
            data: d
          }) {
          var mantissa;
          mantissa = d.mantissa.padStart(cfg.digits_per_idx, max_digit);
          return d.index = (decode(mantissa, digitset)) - cfg._max_integer;
        };
      }
      //.......................................................................................................
      R = new Grammar({
        emit_signals: false
      });
      first = R.new_level({
        name: 'first'
      });
      if (include_negatives) {
        first.new_token({
          name: 'nun',
          fit: fit_nun,
          cast: cast_nun
        });
      }
      first.new_token({
        name: 'pun',
        fit: fit_pun,
        cast: cast_pun
      });
      if (include_negatives) {
        first.new_token({
          name: 'nnum',
          fit: fit_nnum,
          cast: cast_nnum
        });
      }
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
      throw new Error(`Ωhll___4 internal error: unknown type ${rpr(type)}`);
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
        throw new Error(`Ωhll___5 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll___6 expected a non-empty text, got ${rpr(sortkey)}`);
      }
      R = [];
      ref = this.parse(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        unit = ref[i];
        if (unit.name === 'other') {
          message = `Ωhll___7 not a valid sortkey: unable to parse ${rpr(unit.letters)}`;
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
      throw new Error("Ωhll___8 not implemented");
    }

  };

  //===========================================================================================================
  module.exports = (() => {
    var hollerith_10, hollerith_10_cardinal, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383;
    hollerith_10 = new Hollerith(constants_10);
    hollerith_10mvp = new Hollerith(constants_10mvp);
    hollerith_10mvp2 = new Hollerith(constants_10mvp2);
    hollerith_10_cardinal = new Hollerith(constants_10_cardinal);
    hollerith_128 = new Hollerith(constants_128);
    hollerith_128_16383 = new Hollerith(constants_128_16383);
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_10_cardinal, hollerith_128, hollerith_128_16383, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLHFCQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLG1CQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGVBQUEsRUFBQSxtQkFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLE9BQUEsRUFBQSxLQUFBOzs7OztFQUtBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLCtCQUFSOztFQUM1QixDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLE9BQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsRUFDRSxLQURGLEVBRUUsTUFGRixDQUFBLEdBRTRCLE9BQUEsQ0FBUSxVQUFSLENBRjVCOztFQUdBLEtBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVI7O0VBQzVCLENBQUEsQ0FBRSxHQUFGLEVBQ0UsbUJBREYsQ0FBQSxHQUM0QixLQUQ1Qjs7RUFFQSxDQUFBLENBQUUsWUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMs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QUksU0FBSixDQUFjLGdCQUFkO0lBQ3hCLHFCQUFBLEdBQXdCLElBQUksU0FBSixDQUFjLHFCQUFkO0lBQ3hCLGFBQUEsR0FBd0IsSUFBSSxTQUFKLENBQWMsYUFBZDtJQUN4QixtQkFBQSxHQUF3QixJQUFJLFNBQUosQ0FBYyxtQkFBZDtBQUN4QixXQUFPLENBQ0wsU0FESyxFQUVMLFlBRkssRUFHTCxlQUhLLEVBSUwsZ0JBSkssRUFLTCxxQkFMSyxFQU1MLGFBTkssRUFPTCxtQkFQSyxFQVFMLFNBUks7RUFQVyxDQUFBO0FBalRwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyB7IGVuY29kZUJpZ0ludCxcbiMgICBkZWNvZGVCaWdJbnQsICAgfSA9IFRNUF9yZXF1aXJlX2VuY29kZV9pbl9hbHBoYWJldCgpXG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xueyBHcmFtbWFyXG4gIFRva2VuXG4gIExleGVtZSAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG50eXBlcyAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi90eXBlcydcbnsgQ0ZHLFxuICBIb2xsZXJpdGhfdHlwZXNwYWNlLCAgfSA9IHR5cGVzXG57IGNsZWFuX2Fzc2lnbiwgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfY2xlYW5fYXNzaWduKClcbnsgZW5jb2RlLFxuICBkZWNvZGUsXG4gIGxvZ190b19iYXNlLFxuICBnZXRfcmVxdWlyZWRfZGlnaXRzLFxuICBnZXRfbWF4X2ludGVnZXIsICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiIMOjIMOkw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnXG4gICMjIyAgICAgICAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBkaWdpdHNldDogICAgICAgICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICAgICAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjhfMTYzODMgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICAjIyMgICAgICAgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgbWFnbmlmaWVyczogICAgICAgICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcbiAgZGlnaXRzX3Blcl9pZHg6ICAgICAyXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ8OPw5DDkSDDoyDDpMOlw6YnXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ04nXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ0pLTE0gT1BRUidcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwMiA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICdFRkdISUpLTE0gTiBPUFFSU1RVVlcnXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ0FCQyBYWVonXG4gIGRpbWVuc2lvbjogICAgICAgICAgM1xuICBkaWdpdHNfcGVyX2lkeDogICAgIDNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBfY2FyZGluYWwgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdBQkMgWFlaJ1xuICBjYXJkaW5hbHNfb25seTogICAgIHRydWUgIyBub25lZ2F0aXZlc1xuICBkaW1lbnNpb246ICAgICAgICAgIDNcbiAgZGlnaXRzX3Blcl9pZHg6ICAgICAzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBjb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEyOFxuY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmludGVybmFscyA9IGZyZWV6ZSB7XG4gIGNvbnN0YW50cyxcbiAgY29uc3RhbnRzXzEyOCxcbiAgY29uc3RhbnRzXzEyOF8xNjM4MyxcbiAgY29uc3RhbnRzXzEwLFxuICBjb25zdGFudHNfMTBtdnAsXG4gIGNvbnN0YW50c18xMG12cDIsXG4gIGNvbnN0YW50c18xMF9jYXJkaW5hbCxcbiAgdHlwZXMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvbGxlcml0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICB7IGNmZyxcbiAgICAgIHR5cGVzLCAgICAgIH0gPSBjbGFzei52YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmcgY2ZnXG4gICAgQGNmZyAgICAgICAgICAgID0gZnJlZXplIGNmZ1xuICAgIEBsZXhlciAgICAgICAgICA9IEBjb21waWxlX3NvcnRrZXlfbGV4ZXIgQGNmZ1xuICAgIGhpZGUgQCwgJ3R5cGVzJywgIHR5cGVzXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZhbGlkYXRlX2FuZF9jb21waWxlX2NmZzogKCBjZmcgKSAtPlxuICAgICMjIyBWYWxpZGF0aW9uczogIyMjXG4gICAgIyMjIERlcml2YXRpb25zOiAjIyNcbiAgICBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlID1cbiAgICAgIGJsYW5rOiAgICAgICAgICAnXFx4MjAnXG4gICAgICBkaW1lbnNpb246ICAgICAgNVxuICAgICAgY2FyZGluYWxzX29ubHk6IGZhbHNlXG4gICAgUiAgICAgICAgICAgICAgICAgICAgID0gY2xlYW5fYXNzaWduIHt9LCBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlLCBjZmdcbiAgICB0eXBlcyAgICAgICAgICAgICAgICAgPSBuZXcgSG9sbGVyaXRoX3R5cGVzcGFjZSB7IGJsYW5rOiBSLmJsYW5rLCB9XG4gICAgUi5jYXJkaW5hbHNfb25seSAgICAgID0gdHlwZXMuY2FyZGluYWxzX29ubHkudmFsaWRhdGUgUi5jYXJkaW5hbHNfb25seVxuICAgIFIuZGlnaXRzZXQgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LnZhbGlkYXRlIFIuZGlnaXRzZXRcbiAgICBSLl9kaWdpdHNfbGlzdCAgICAgICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9kaWdpdHNfbGlzdFxuICAgIFIuX25hdWdodCAgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX25hdWdodFxuICAgIFIuX25vdmEgICAgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX25vdmFcbiAgICBSLl9sZWFkaW5nX25vdmFzX3JlICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9sZWFkaW5nX25vdmFzX3JlXG4gICAgUi5fYmFzZSAgICAgICAgICAgICAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fYmFzZVxuICAgIFIubWFnbmlmaWVycyAgICAgICAgICA9IHR5cGVzLm1hZ25pZmllcnMudmFsaWRhdGUgUi5tYWduaWZpZXJzLCB7IGNhcmRpbmFsc19vbmx5OiBSLmNhcmRpbmFsc19vbmx5LCB9XG4gICAgUi5fcG1hZ19saXN0ICAgICAgICAgID0gdHlwZXMubWFnbmlmaWVycy5kYXRhLl9wbWFnX2xpc3RcbiAgICBSLl9ubWFnX2xpc3QgICAgICAgICAgPSB0eXBlcy5tYWduaWZpZXJzLmRhdGEuX25tYWdfbGlzdFxuICAgIFIudW5pbGl0ZXJhbHMgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLnZhbGlkYXRlIFIudW5pbGl0ZXJhbHNcbiAgICBSLl9jaXBoZXIgICAgICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl9jaXBoZXJcbiAgICBSLl9udW5zICAgICAgICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl9udW5zXG4gICAgUi5fenB1bnMgICAgICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fenB1bnNcbiAgICBSLl9udW5zX2xpc3QgICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl9udW5zX2xpc3RcbiAgICBSLl96cHVuc19saXN0ICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl96cHVuc19saXN0XG4gICAgaWYgUi5fY2lwaGVyIGlzbnQgUi5fenB1bnNfbGlzdFsgMCBdXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzEgaW50ZXJuYWwgZXJyb3I6IF9jaXBoZXIgI3tycHIgUi5fY2lwaGVyfSBkb2Vzbid0IG1hdGNoIF96cHVucyAje3JwciBSLl96cHVuc31cIlxuICAgIFIuX21pbl9udW4gICAgICAgICAgICA9IC1SLl9udW5zX2xpc3QubGVuZ3RoXG4gICAgUi5fbWF4X3pwdW4gICAgICAgICAgID0gUi5fenB1bnNfbGlzdC5sZW5ndGggLSAxXG4gICAgUi5kaW1lbnNpb24gICAgICAgICAgID0gdHlwZXMuZGltZW5zaW9uLnZhbGlkYXRlIFIuZGltZW5zaW9uXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLmRpZ2l0c19wZXJfaWR4ICAgICA/PSBNYXRoLm1pbiAoIFIuX3BtYWdfbGlzdC5sZW5ndGggLSAxICksICggUi5kaWdpdHNfcGVyX2lkeCA/IEluZmluaXR5IClcbiAgICBSLmRpZ2l0c19wZXJfaWR4ICAgICAgPSB0eXBlcy5kaWdpdHNfcGVyX2lkeC52YWxpZGF0ZSBSLmRpZ2l0c19wZXJfaWR4LCBSLl9wbWFnX2xpc3RcbiAgICBSLl9tYXhfaW50ZWdlciAgICAgICAgPSB0eXBlcy5jcmVhdGVfbWF4X2ludGVnZXIgeyBfYmFzZTogUi5fYmFzZSwgZGlnaXRzX3Blcl9pZHg6IFIuZGlnaXRzX3Blcl9pZHgsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyBSLmNhcmRpbmFsc19vbmx5XG4gICAgICBpZiBSLl9ubWFnX2xpc3QubGVuZ3RoIDwgUi5kaWdpdHNfcGVyX2lkeFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzIgZGlnaXRzX3Blcl9pZHggaXMgI3tSLmRpZ2l0c19wZXJfaWR4fSwgYnV0IHRoZXJlIGFyZSBvbmx5ICN7Ui5fbm1hZ19saXN0Lmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgICBlbHNlIGlmIFIuX25tYWdfbGlzdC5sZW5ndGggPiBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICAgIFIuX25tYWdfbGlzdCA9IGZyZWV6ZSBSLl9ubWFnX2xpc3RbIC4uIFIuZGlnaXRzX3Blcl9pZHggXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgUi5fcG1hZ19saXN0Lmxlbmd0aCA8IFIuZGlnaXRzX3Blcl9pZHhcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMyBkaWdpdHNfcGVyX2lkeCBpcyAje1IuZGlnaXRzX3Blcl9pZHh9LCBidXQgdGhlcmUgYXJlIG9ubHkgI3tSLl9wbWFnX2xpc3QubGVuZ3RofSBwb3NpdGl2ZSBtYWduaWZpZXJzXCJcbiAgICBlbHNlIGlmIFIuX3BtYWdfbGlzdC5sZW5ndGggPiBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICBSLl9wbWFnX2xpc3QgPSBmcmVlemUgUi5fcG1hZ19saXN0WyAuLiBSLmRpZ2l0c19wZXJfaWR4IF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuX3BtYWcgICAgICAgICAgICAgICA9IFIuX3BtYWdfbGlzdC5qb2luICcnXG4gICAgUi5fbm1hZyAgICAgICAgICAgICAgID0gaWYgUi5jYXJkaW5hbHNfb25seSB0aGVuIG51bGwgZWxzZSBSLl9ubWFnX2xpc3Quam9pbiAnJ1xuICAgIFIuX21heF9pZHhfd2lkdGggICAgICA9IFIuZGlnaXRzX3Blcl9pZHggKyAxXG4gICAgUi5fc29ydGtleV93aWR0aCAgICAgID0gUi5fbWF4X2lkeF93aWR0aCAqIFIuZGltZW5zaW9uXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLl9taW5faW50ZWdlciAgICAgICAgPSAtUi5fbWF4X2ludGVnZXJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBUQUlOVCB0aGlzIGNhbiBiZSBncmVhdGx5IHNpbXBsaWZpZWQgd2l0aCBUbyBEb3MgaW1wbGVtZW50ZWQgIyMjXG4gICAgbm1hZ3MgICAgICAgICAgICAgICAgID0gaWYgUi5jYXJkaW5hbHNfb25seSB0aGVuICcnIGVsc2UgWyBSLl9ubWFnX2xpc3QuLi4sIF0ucmV2ZXJzZSgpLmpvaW4gJydcbiAgICBudW5zICAgICAgICAgICAgICAgICAgPSBpZiBSLmNhcmRpbmFsc19vbmx5IHRoZW4gJycgZWxzZSBSLl9udW5zXG4gICAgUi5fYWxwaGFiZXQgICAgICAgICAgID0gdHlwZXMuX2FscGhhYmV0LnZhbGlkYXRlICggUi5kaWdpdHNldCArIFxcXG4gICAgICBubWFncyAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgIG51bnMgICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgUi5fenB1bnMgICAgICAgICAgICAgICAgICArIFxcXG4gICAgICBSLl9wbWFnICAgICAgICAgICAgICAgICAgICAgKS5yZXBsYWNlIHR5cGVzW0NGR10uYmxhbmtfc3BsaXR0ZXIsICcnXG4gICAgcmV0dXJuIHsgY2ZnOiBSLCB0eXBlcywgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29tcGlsZV9zb3J0a2V5X2xleGVyOiAoIGNmZyApIC0+XG4gICAgeyBfbnVucyxcbiAgICAgIF96cHVucyxcbiAgICAgIF9ubWFnLFxuICAgICAgX3BtYWcsXG4gICAgICBkaWdpdHNldCwgICAgIH0gPSBjZmdcbiAgICAjIF9iYXNlICAgICAgICAgICAgICA9IGRpZ2l0c2V0Lmxlbmd0aFxuICAgIGluY2x1ZGVfbmVnYXRpdmVzID0gbm90IGNmZy5jYXJkaW5hbHNfb25seVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcHVuc19sZXR0ZXJzICA9IF96cHVuc1sgIDEgLi4gIF1cbiAgICBwbWFnX2xldHRlcnMgID0gX3BtYWdbICAgMSAuLiAgXVxuICAgIHplcm9fbGV0dGVycyAgPSBfenB1bnNbICAwICAgICBdXG4gICAgbWF4X2RpZ2l0ICAgICA9IGRpZ2l0c2V0LmF0IC0xXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmaXRfcHVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twdW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfcG51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twbWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3tkaWdpdHNldH0gIF0qICkgXCJcbiAgICBmaXRfcGFkZGluZyAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0rICkgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfemVybyAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0gICg/PSAuKiBbXiAje3plcm9fbGV0dGVyc30gXSApICkgICAgIFwiXG4gICAgZml0X290aGVyICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiAuICAgICAgICAgICAgICAgICAgICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgYWxsX3plcm9fcmUgICA9IHJlZ2V4XCJeICN7emVyb19sZXR0ZXJzfSsgJFwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjYXN0X3B1biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICtjZmcuX3pwdW5zLmluZGV4T2YgIGQubGV0dGVyc1xuICAgIGNhc3RfcG51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gZGVjb2RlIGQubWFudGlzc2EsIGRpZ2l0c2V0XG4gICAgY2FzdF96ZXJvICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAwXG4gICAgY2FzdF9wYWRkaW5nICA9ICh7IGRhdGE6IGQsIHNvdXJjZSwgaGl0LCB9KSAtPiBkLmluZGV4ID0gMCBpZiBzb3VyY2UgaXMgaGl0XG4gICAgY2FzdF9vdGhlciAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGluY2x1ZGVfbmVnYXRpdmVzXG4gICAgICBudW5zX2xldHRlcnMgID0gX251bnNcbiAgICAgIG5tYWdfbGV0dGVycyAgPSBfbm1hZ1sgICAxIC4uICBdXG4gICAgICBmaXRfbnVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tudW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICAgIGZpdF9ubnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje25tYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2RpZ2l0c2V0fSAgXSogKSBcIlxuICAgICAgY2FzdF9udW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAoIGNmZy5fbnVucy5pbmRleE9mIGQubGV0dGVycyApIC0gY2ZnLl9udW5zLmxlbmd0aFxuICAgICAgY2FzdF9ubnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+XG4gICAgICAgIG1hbnRpc3NhICA9IGQubWFudGlzc2EucGFkU3RhcnQgY2ZnLmRpZ2l0c19wZXJfaWR4LCBtYXhfZGlnaXRcbiAgICAgICAgZC5pbmRleCAgID0gKCBkZWNvZGUgbWFudGlzc2EsIGRpZ2l0c2V0ICkgLSBjZmcuX21heF9pbnRlZ2VyXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICAgID0gbmV3IEdyYW1tYXIgeyBlbWl0X3NpZ25hbHM6IGZhbHNlLCB9XG4gICAgZmlyc3QgICAgICAgICA9IFIubmV3X2xldmVsIHsgbmFtZTogJ2ZpcnN0JywgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ251bicsICAgICAgZml0OiBmaXRfbnVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfbnVuLCAgICAgIH0gaWYgaW5jbHVkZV9uZWdhdGl2ZXNcbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwdW4nLCAgICAgIGZpdDogZml0X3B1biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3B1biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbm51bScsICAgICBmaXQ6IGZpdF9ubnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9ubnVtLCAgICAgfSBpZiBpbmNsdWRlX25lZ2F0aXZlc1xuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BudW0nLCAgICAgZml0OiBmaXRfcG51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcG51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwYWRkaW5nJywgIGZpdDogZml0X3BhZGRpbmcsICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BhZGRpbmcsICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnemVybycsICAgICBmaXQ6IGZpdF96ZXJvLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF96ZXJvLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ290aGVyJywgICAgZml0OiBmaXRfb3RoZXIsIG1lcmdlOiAnbGlzdCcsIGNhc3Q6IGNhc3Rfb3RoZXIsICAgIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGU6ICggaWR4X29yX3ZkeCApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICBAdHlwZXMuaWR4X29yX3ZkeC52YWxpZGF0ZSBpZHhfb3JfdmR4XG4gICAgc3dpdGNoIHR5cGUgPSBAdHlwZXMuaWR4X29yX3ZkeC5kYXRhLnR5cGVcbiAgICAgIHdoZW4gJ2lkeCcgdGhlbiByZXR1cm4gQGVuY29kZV9pZHggIGlkeF9vcl92ZHhcbiAgICAgIHdoZW4gJ3ZkeCcgdGhlbiByZXR1cm4gQF9lbmNvZGVfdmR4IGlkeF9vcl92ZHhcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzQgaW50ZXJuYWwgZXJyb3I6IHVua25vd24gdHlwZSAje3JwciB0eXBlfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfaWR4OiAoIGlkeCApIC0+IEBfZW5jb2RlX2lkeCBAdHlwZXMuaWR4LnZhbGlkYXRlIGlkeCwgQGNmZy5fbWluX2ludGVnZXIsIEBjZmcuX21heF9pbnRlZ2VyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZW5jb2RlX2lkeDogKCBpZHggKSAtPlxuICAgICMjIyBOT1RFIGNhbGwgb25seSB3aGVyZSBhc3N1cmVkIGBpZHhgIGlzIGludGVnZXIgd2l0aGluIG1hZ25pdHVkZSBvZiBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuICggQGNmZy5fenB1bnMuYXQgaWR4ICkgaWYgMCAgICAgICAgICAgICAgPD0gaWR4IDw9IEBjZmcuX21heF96cHVuICAjIFplcm8gb3Igc21hbGwgcG9zaXRpdmVcbiAgICByZXR1cm4gKCBAY2ZnLl9udW5zLmF0ICBpZHggKSBpZiBAY2ZnLl9taW5fbnVuICA8PSBpZHggPCAgMCAgICAgICAgICAgICAgICMgU21hbGwgbmVnYXRpdmVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGlkeCA+IEBjZmcuX21heF96cHVuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgQmlnIHBvc2l0aXZlXG4gICAgICBSID0gZW5jb2RlIGlkeCwgQGNmZy5kaWdpdHNldFxuICAgICAgcmV0dXJuICggQGNmZy5fcG1hZy5hdCBSLmxlbmd0aCApICsgUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiA9ICggZW5jb2RlICggaWR4ICsgQGNmZy5fbWF4X2ludGVnZXIgICAgICksIEBjZmcuZGlnaXRzZXQgKSAgICAgICAgICAgIyBCaWcgbmVnYXRpdmVcbiAgICBpZiBSLmxlbmd0aCA8IEBjZmcuZGlnaXRzX3Blcl9pZHggdGhlbiBSID0gUi5wYWRTdGFydCBAY2ZnLmRpZ2l0c19wZXJfaWR4LCBAY2ZnLmRpZ2l0c2V0LmF0IDBcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUiA9IFIucmVwbGFjZSBAY2ZnLl9sZWFkaW5nX25vdmFzX3JlLCAnJ1xuICAgIHJldHVybiAoIEBjZmcuX25tYWcuYXQgUi5sZW5ndGggKSArIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZV92ZHg6ICggdmR4ICkgLT4gQF9lbmNvZGVfdmR4IEB0eXBlcy52ZHgudmFsaWRhdGUgdmR4XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZW5jb2RlX3ZkeDogKCB2ZHggKSAtPiBcXFxuICAgICggKCBAZW5jb2RlX2lkeCBpZHggZm9yIGlkeCBpbiB2ZHggKS5qb2luICcnICkucGFkRW5kIEBjZmcuX3NvcnRrZXlfd2lkdGgsIEBjZmcuX2NpcGhlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcGFyc2U6ICggc29ydGtleSApIC0+XG4gICAgUiA9IFtdXG4gICAgZm9yIGxleGVtZSBpbiBAbGV4ZXIuc2Nhbl90b19saXN0IHNvcnRrZXlcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGRhdGEsICAgICAgIH0gPSBsZXhlbWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeyBsZXR0ZXJzLFxuICAgICAgICBtYW50aXNzYSxcbiAgICAgICAgaW5kZXgsICAgICAgfSA9IGRhdGFcbiAgICAgIGxldHRlcnMgICAgICAgICA9IGxldHRlcnMuam9pbiAnJyBpZiAoIHR5cGVfb2YgbGV0dGVycyApIGlzICdsaXN0J1xuICAgICAgbWFudGlzc2EgICAgICAgPz0gbnVsbFxuICAgICAgaW5kZXggICAgICAgICAgPz0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLnB1c2ggeyBuYW1lLCBsZXR0ZXJzLCBtYW50aXNzYSwgaW5kZXgsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlOiAoIHNvcnRrZXkgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc29ydGtleSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX181IGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIHNvcnRrZXkubGVuZ3RoID4gMFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX182IGV4cGVjdGVkIGEgbm9uLWVtcHR5IHRleHQsIGdvdCAje3JwciBzb3J0a2V5fVwiXG4gICAgUiA9IFtdXG4gICAgZm9yIHVuaXQgaW4gQHBhcnNlIHNvcnRrZXlcbiAgICAgIGlmIHVuaXQubmFtZSBpcyAnb3RoZXInXG4gICAgICAgIG1lc3NhZ2UgICA9IFwizqlobGxfX183IG5vdCBhIHZhbGlkIHNvcnRrZXk6IHVuYWJsZSB0byBwYXJzZSAje3JwciB1bml0LmxldHRlcnN9XCJcbiAgICAgICAgbWVzc2FnZSAgKz0gXCIgaW4gI3tycHIgc29ydGtleX1cIiBpZiBzb3J0a2V5IGlzbnQgdW5pdC5sZXR0ZXJzXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBtZXNzYWdlXG4gICAgICBSLnB1c2ggdW5pdC5pbmRleCBpZiB1bml0LmluZGV4P1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzggbm90IGltcGxlbWVudGVkXCJcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGhvbGxlcml0aF8xMCAgICAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwXG4gIGhvbGxlcml0aF8xMG12cCAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwXG4gIGhvbGxlcml0aF8xMG12cDIgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwMlxuICBob2xsZXJpdGhfMTBfY2FyZGluYWwgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMF9jYXJkaW5hbFxuICBob2xsZXJpdGhfMTI4ICAgICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhcbiAgaG9sbGVyaXRoXzEyOF8xNjM4MyAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XzE2MzgzXG4gIHJldHVybiB7XG4gICAgSG9sbGVyaXRoLFxuICAgIGhvbGxlcml0aF8xMCxcbiAgICBob2xsZXJpdGhfMTBtdnAsXG4gICAgaG9sbGVyaXRoXzEwbXZwMixcbiAgICBob2xsZXJpdGhfMTBfY2FyZGluYWwsXG4gICAgaG9sbGVyaXRoXzEyOCxcbiAgICBob2xsZXJpdGhfMTI4XzE2MzgzLFxuICAgIGludGVybmFscywgfVxuIl19
