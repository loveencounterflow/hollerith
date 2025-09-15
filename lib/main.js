(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10_cardinal, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, freeze, get_max_integer, get_required_digits, hide, internals, log_to_base, regex, rpr, set_getter, test, type_of;

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

  ({CFG, Hollerith_typespace} = require('./types'));

  ({clean_assign} = SFMODULES.unstable.require_clean_assign());

  ({encode, decode, log_to_base, get_required_digits, get_max_integer} = SFMODULES.unstable.require_anybase());

  ({freeze} = Object);

  ({hide, set_getter} = SFMODULES.require_managed_property_tools());

  test = require('./test-hollerith');

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
  internals = freeze({
    constants,
    constants_128,
    constants_128_16383,
    constants_10,
    constants_10mvp,
    constants_10mvp2,
    constants_10_cardinal,
    types: require('./types')
  });

  //===========================================================================================================
  Hollerith = class Hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var clasz, types;
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
      var R, hollerith_cfg_template, nmags, nuns, ref, types;
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
      R.uniliterals = types.uniliterals.validate(R.uniliterals, {
        cardinals_only: R.cardinals_only
      });
      R._cipher = types.uniliterals.data._cipher;
      R._nuns = types.uniliterals.data._nuns;
      R._zpuns = types.uniliterals.data._zpuns;
      R._nuns_list = types.uniliterals.data._nuns_list;
      R._zpuns_list = types.uniliterals.data._zpuns_list;
      if (R._cipher !== R._zpuns_list[0]) {
        throw new Error(`Ωhll___1 internal error: _cipher ${rpr(R._cipher)} doesn't match _zpuns ${rpr(R._zpuns)}`);
      }
      R._min_nun = R._nuns_list != null ? -R._nuns_list.length : 0;
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
      R._min_integer = R.cardinals_only ? 0 : -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      /* TAINT while treatment of NUNs, ZPUNs is unsatisfactory they're scheduled to be removed anyways so
             we refrain from improving that */
      nmags = R.cardinals_only ? '' : [...R._nmag_list].reverse().join('');
      nuns = R.cardinals_only ? '' : R._nuns;
      R._alphabet = types._alphabet.validate((R.digitset + nmags + (nuns != null ? nuns : '') + R._zpuns + R._pmag).replace(types[CFG].blank_splitter, ''));
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
      if (this.cfg.cardinals_only) {
        throw new Error(`Ωhll___5 unable to encode negative idx ${idx} with cardinals-only codec`);
      }
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
    var hollerith_10, hollerith_10_cardinal, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383;
    hollerith_10 = new Hollerith(constants_10);
    hollerith_10mvp = new Hollerith(constants_10mvp);
    hollerith_10mvp2 = new Hollerith(constants_10mvp2);
    hollerith_10_cardinal = new Hollerith(constants_10_cardinal);
    hollerith_128 = new Hollerith(constants_128);
    hollerith_128_16383 = new Hollerith(constants_128_16383);
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_10_cardinal, hollerith_128, hollerith_128_16383, test, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLHFCQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLG1CQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGVBQUEsRUFBQSxtQkFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBOzs7OztFQUtBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLCtCQUFSOztFQUM1QixDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLE9BQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsRUFDRSxLQURGLEVBRUUsTUFGRixDQUFBLEdBRTRCLE9BQUEsQ0FBUSxVQUFSLENBRjVCOztFQUdBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsbUJBREYsQ0FBQSxHQUM0QixPQUFBLENBQVEsU0FBUixDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsWUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0JBQW5CLENBQUEsQ0FBNUI7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QXZMVjs7O0lBdU1FLGNBQWdCLENBQUUsQ0FBRixDQUFBO01BQ2QsTUFBTSxJQUFJLEtBQUosQ0FBVSwwQkFBVjtJQURROztFQXpNbEIsRUF4R0E7OztFQXFUQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3BCLFFBQUEsWUFBQSxFQUFBLHFCQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBO0lBQUUsWUFBQSxHQUF3QixJQUFJLFNBQUosQ0FBYyxZQUFkO0lBQ3hCLGVBQUEsR0FBd0IsSUFBSSxTQUFKLENBQWMsZUFBZDtJQUN4QixnQkFBQSxHQUF3QixJQUFJLFNBQUosQ0FBYyxnQkFBZDtJQUN4QixxQkFBQSxHQUF3QixJQUFJLFNBQUosQ0FBYyxxQkFBZDtJQUN4QixhQUFBLEdBQXdCLElBQUksU0FBSixDQUFjLGFBQWQ7SUFDeEIsbUJBQUEsR0FBd0IsSUFBSSxTQUFKLENBQWMsbUJBQWQ7QUFDeEIsV0FBTyxDQUNMLFNBREssRUFFTCxZQUZLLEVBR0wsZUFISyxFQUlMLGdCQUpLLEVBS0wscUJBTEssRUFNTCxhQU5LLEVBT0wsbUJBUEssRUFRTCxJQVJLLEVBU0wsU0FUSztFQVBXLENBQUE7QUFyVHBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIHsgZW5jb2RlQmlnSW50LFxuIyAgIGRlY29kZUJpZ0ludCwgICB9ID0gVE1QX3JlcXVpcmVfZW5jb2RlX2luX2FscGhhYmV0KClcblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2luZ2xlLWZpbGUtbW9kdWxlcydcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IHJlZ2V4LCAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAncmVnZXgnXG57IEdyYW1tYXJcbiAgVG9rZW5cbiAgTGV4ZW1lICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdpbnRlcmxleCdcbnsgQ0ZHLFxuICBIb2xsZXJpdGhfdHlwZXNwYWNlLCAgfSA9IHJlcXVpcmUgJy4vdHlwZXMnXG57IGNsZWFuX2Fzc2lnbiwgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfY2xlYW5fYXNzaWduKClcbnsgZW5jb2RlLFxuICBkZWNvZGUsXG4gIGxvZ190b19iYXNlLFxuICBnZXRfcmVxdWlyZWRfZGlnaXRzLFxuICBnZXRfbWF4X2ludGVnZXIsICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxudGVzdCAgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vdGVzdC1ob2xsZXJpdGgnXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4ID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6Igw6Mgw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtydcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOF8xNjM4MyA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiIMOjIMOkw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnXG4gICMjIyAgICAgICAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBkaWdpdHNldDogICAgICAgICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICAgICAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuICBkaWdpdHNfcGVyX2lkeDogICAgIDJcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTAgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnw4/DkMORIMOjIMOkw6XDpidcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAgICAgICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnTidcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAgICAgICAnSktMTSBPUFFSJ1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAyID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ0VGR0hJSktMTSBOIE9QUVJTVFVWVydcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAgICAgICAnQUJDIFhZWidcbiAgZGltZW5zaW9uOiAgICAgICAgICAzXG4gIGRpZ2l0c19wZXJfaWR4OiAgICAgM1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMF9jYXJkaW5hbCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICdFRkdISUpLTE0gTiBPUFFSU1RVVlcnXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ0FCQyBYWVonXG4gIGNhcmRpbmFsc19vbmx5OiAgICAgdHJ1ZSAjIG5vbmVnYXRpdmVzXG4gIGRpbWVuc2lvbjogICAgICAgICAgM1xuICBkaWdpdHNfcGVyX2lkeDogICAgIDNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTI4XG5jb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEwXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaW50ZXJuYWxzID0gZnJlZXplIHtcbiAgY29uc3RhbnRzLFxuICBjb25zdGFudHNfMTI4LFxuICBjb25zdGFudHNfMTI4XzE2MzgzLFxuICBjb25zdGFudHNfMTAsXG4gIGNvbnN0YW50c18xMG12cCxcbiAgY29uc3RhbnRzXzEwbXZwMixcbiAgY29uc3RhbnRzXzEwX2NhcmRpbmFsLFxuICB0eXBlczogKCByZXF1aXJlICcuL3R5cGVzJyApLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgeyBjZmcsXG4gICAgICB0eXBlcywgICAgICB9ID0gY2xhc3oudmFsaWRhdGVfYW5kX2NvbXBpbGVfY2ZnIGNmZ1xuICAgIEBjZmcgICAgICAgICAgICA9IGZyZWV6ZSBjZmdcbiAgICBAbGV4ZXIgICAgICAgICAgPSBAY29tcGlsZV9zb3J0a2V5X2xleGVyIEBjZmdcbiAgICBoaWRlIEAsICd0eXBlcycsICB0eXBlc1xuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEB2YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmc6ICggY2ZnICkgLT5cbiAgICAjIyMgVmFsaWRhdGlvbnM6ICMjI1xuICAgICMjIyBEZXJpdmF0aW9uczogIyMjXG4gICAgaG9sbGVyaXRoX2NmZ190ZW1wbGF0ZSA9XG4gICAgICBibGFuazogICAgICAgICAgJ1xceDIwJ1xuICAgICAgZGltZW5zaW9uOiAgICAgIDVcbiAgICAgIGNhcmRpbmFsc19vbmx5OiBmYWxzZVxuICAgIFIgICAgICAgICAgICAgICAgICAgICA9IGNsZWFuX2Fzc2lnbiB7fSwgaG9sbGVyaXRoX2NmZ190ZW1wbGF0ZSwgY2ZnXG4gICAgdHlwZXMgICAgICAgICAgICAgICAgID0gbmV3IEhvbGxlcml0aF90eXBlc3BhY2UgeyBibGFuazogUi5ibGFuaywgfVxuICAgIFIuY2FyZGluYWxzX29ubHkgICAgICA9IHR5cGVzLmNhcmRpbmFsc19vbmx5LnZhbGlkYXRlIFIuY2FyZGluYWxzX29ubHlcbiAgICBSLmRpZ2l0c2V0ICAgICAgICAgICAgPSB0eXBlcy5kaWdpdHNldC52YWxpZGF0ZSBSLmRpZ2l0c2V0XG4gICAgUi5fZGlnaXRzX2xpc3QgICAgICAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fZGlnaXRzX2xpc3RcbiAgICBSLl9uYXVnaHQgICAgICAgICAgICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9uYXVnaHRcbiAgICBSLl9ub3ZhICAgICAgICAgICAgICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9ub3ZhXG4gICAgUi5fbGVhZGluZ19ub3Zhc19yZSAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fbGVhZGluZ19ub3Zhc19yZVxuICAgIFIuX2Jhc2UgICAgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX2Jhc2VcbiAgICBSLm1hZ25pZmllcnMgICAgICAgICAgPSB0eXBlcy5tYWduaWZpZXJzLnZhbGlkYXRlIFIubWFnbmlmaWVycywgeyBjYXJkaW5hbHNfb25seTogUi5jYXJkaW5hbHNfb25seSwgfVxuICAgIFIuX3BtYWdfbGlzdCAgICAgICAgICA9IHR5cGVzLm1hZ25pZmllcnMuZGF0YS5fcG1hZ19saXN0XG4gICAgUi5fbm1hZ19saXN0ICAgICAgICAgID0gdHlwZXMubWFnbmlmaWVycy5kYXRhLl9ubWFnX2xpc3RcbiAgICBSLnVuaWxpdGVyYWxzICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy52YWxpZGF0ZSBSLnVuaWxpdGVyYWxzLCB7IGNhcmRpbmFsc19vbmx5OiBSLmNhcmRpbmFsc19vbmx5LCB9XG4gICAgUi5fY2lwaGVyICAgICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fY2lwaGVyXG4gICAgUi5fbnVucyAgICAgICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc1xuICAgIFIuX3pwdW5zICAgICAgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLmRhdGEuX3pwdW5zXG4gICAgUi5fbnVuc19saXN0ICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc19saXN0XG4gICAgUi5fenB1bnNfbGlzdCAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fenB1bnNfbGlzdFxuICAgIGlmIFIuX2NpcGhlciBpc250IFIuX3pwdW5zX2xpc3RbIDAgXVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18xIGludGVybmFsIGVycm9yOiBfY2lwaGVyICN7cnByIFIuX2NpcGhlcn0gZG9lc24ndCBtYXRjaCBfenB1bnMgI3tycHIgUi5fenB1bnN9XCJcbiAgICBSLl9taW5fbnVuICAgICAgICAgICAgPSBpZiBSLl9udW5zX2xpc3Q/IHRoZW4gLVIuX251bnNfbGlzdC5sZW5ndGggZWxzZSAwXG4gICAgUi5fbWF4X3pwdW4gICAgICAgICAgID0gUi5fenB1bnNfbGlzdC5sZW5ndGggLSAxXG4gICAgUi5kaW1lbnNpb24gICAgICAgICAgID0gdHlwZXMuZGltZW5zaW9uLnZhbGlkYXRlIFIuZGltZW5zaW9uXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLmRpZ2l0c19wZXJfaWR4ICAgICA/PSBNYXRoLm1pbiAoIFIuX3BtYWdfbGlzdC5sZW5ndGggLSAxICksICggUi5kaWdpdHNfcGVyX2lkeCA/IEluZmluaXR5IClcbiAgICBSLmRpZ2l0c19wZXJfaWR4ICAgICAgPSB0eXBlcy5kaWdpdHNfcGVyX2lkeC52YWxpZGF0ZSBSLmRpZ2l0c19wZXJfaWR4LCBSLl9wbWFnX2xpc3RcbiAgICBSLl9tYXhfaW50ZWdlciAgICAgICAgPSB0eXBlcy5jcmVhdGVfbWF4X2ludGVnZXIgeyBfYmFzZTogUi5fYmFzZSwgZGlnaXRzX3Blcl9pZHg6IFIuZGlnaXRzX3Blcl9pZHgsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHVubGVzcyBSLmNhcmRpbmFsc19vbmx5XG4gICAgICBpZiBSLl9ubWFnX2xpc3QubGVuZ3RoIDwgUi5kaWdpdHNfcGVyX2lkeFxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzIgZGlnaXRzX3Blcl9pZHggaXMgI3tSLmRpZ2l0c19wZXJfaWR4fSwgYnV0IHRoZXJlIGFyZSBvbmx5ICN7Ui5fbm1hZ19saXN0Lmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgICBlbHNlIGlmIFIuX25tYWdfbGlzdC5sZW5ndGggPiBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICAgIFIuX25tYWdfbGlzdCA9IGZyZWV6ZSBSLl9ubWFnX2xpc3RbIC4uIFIuZGlnaXRzX3Blcl9pZHggXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgUi5fcG1hZ19saXN0Lmxlbmd0aCA8IFIuZGlnaXRzX3Blcl9pZHhcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMyBkaWdpdHNfcGVyX2lkeCBpcyAje1IuZGlnaXRzX3Blcl9pZHh9LCBidXQgdGhlcmUgYXJlIG9ubHkgI3tSLl9wbWFnX2xpc3QubGVuZ3RofSBwb3NpdGl2ZSBtYWduaWZpZXJzXCJcbiAgICBlbHNlIGlmIFIuX3BtYWdfbGlzdC5sZW5ndGggPiBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICBSLl9wbWFnX2xpc3QgPSBmcmVlemUgUi5fcG1hZ19saXN0WyAuLiBSLmRpZ2l0c19wZXJfaWR4IF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuX3BtYWcgICAgICAgICAgICAgICA9IFIuX3BtYWdfbGlzdC5qb2luICcnXG4gICAgUi5fbm1hZyAgICAgICAgICAgICAgID0gaWYgUi5jYXJkaW5hbHNfb25seSB0aGVuIG51bGwgZWxzZSBSLl9ubWFnX2xpc3Quam9pbiAnJ1xuICAgIFIuX21heF9pZHhfd2lkdGggICAgICA9IFIuZGlnaXRzX3Blcl9pZHggKyAxXG4gICAgUi5fc29ydGtleV93aWR0aCAgICAgID0gUi5fbWF4X2lkeF93aWR0aCAqIFIuZGltZW5zaW9uXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLl9taW5faW50ZWdlciAgICAgICAgPSBpZiBSLmNhcmRpbmFsc19vbmx5IHRoZW4gMCBlbHNlIC1SLl9tYXhfaW50ZWdlclxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyMjIFRBSU5UIHRoaXMgY2FuIGJlIGdyZWF0bHkgc2ltcGxpZmllZCB3aXRoIFRvIERvcyBpbXBsZW1lbnRlZCAjIyNcbiAgICAjIyMgVEFJTlQgd2hpbGUgdHJlYXRtZW50IG9mIE5VTnMsIFpQVU5zIGlzIHVuc2F0aXNmYWN0b3J5IHRoZXkncmUgc2NoZWR1bGVkIHRvIGJlIHJlbW92ZWQgYW55d2F5cyBzb1xuICAgICAgICB3ZSByZWZyYWluIGZyb20gaW1wcm92aW5nIHRoYXQgIyMjXG4gICAgbm1hZ3MgICAgICAgICAgICAgICAgID0gaWYgUi5jYXJkaW5hbHNfb25seSB0aGVuICcnIGVsc2UgWyBSLl9ubWFnX2xpc3QuLi4sIF0ucmV2ZXJzZSgpLmpvaW4gJydcbiAgICBudW5zICAgICAgICAgICAgICAgICAgPSBpZiBSLmNhcmRpbmFsc19vbmx5IHRoZW4gJycgZWxzZSBSLl9udW5zXG4gICAgUi5fYWxwaGFiZXQgICAgICAgICAgID0gdHlwZXMuX2FscGhhYmV0LnZhbGlkYXRlICggUi5kaWdpdHNldCArIFxcXG4gICAgICBubWFncyAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgICggbnVucyA/ICcnICkgICAgICAgICAgICAgKyBcXFxuICAgICAgUi5fenB1bnMgICAgICAgICAgICAgICAgICArIFxcXG4gICAgICBSLl9wbWFnICAgICAgICAgICAgICAgICAgICAgKS5yZXBsYWNlIHR5cGVzW0NGR10uYmxhbmtfc3BsaXR0ZXIsICcnXG4gICAgcmV0dXJuIHsgY2ZnOiBSLCB0eXBlcywgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29tcGlsZV9zb3J0a2V5X2xleGVyOiAoIGNmZyApIC0+XG4gICAgeyBfbnVucyxcbiAgICAgIF96cHVucyxcbiAgICAgIF9ubWFnLFxuICAgICAgX3BtYWcsXG4gICAgICBkaWdpdHNldCwgICAgIH0gPSBjZmdcbiAgICAjIF9iYXNlICAgICAgICAgICAgICA9IGRpZ2l0c2V0Lmxlbmd0aFxuICAgIGluY2x1ZGVfbmVnYXRpdmVzID0gbm90IGNmZy5jYXJkaW5hbHNfb25seVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcHVuc19sZXR0ZXJzICA9IF96cHVuc1sgIDEgLi4gIF1cbiAgICBwbWFnX2xldHRlcnMgID0gX3BtYWdbICAgMSAuLiAgXVxuICAgIHplcm9fbGV0dGVycyAgPSBfenB1bnNbICAwICAgICBdXG4gICAgbWF4X2RpZ2l0ICAgICA9IGRpZ2l0c2V0LmF0IC0xXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmaXRfcHVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twdW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfcG51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twbWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3tkaWdpdHNldH0gIF0qICkgXCJcbiAgICBmaXRfcGFkZGluZyAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0rICkgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfemVybyAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0gICg/PSAuKiBbXiAje3plcm9fbGV0dGVyc30gXSApICkgICAgIFwiXG4gICAgZml0X290aGVyICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiAuICAgICAgICAgICAgICAgICAgICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgYWxsX3plcm9fcmUgICA9IHJlZ2V4XCJeICN7emVyb19sZXR0ZXJzfSsgJFwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjYXN0X3B1biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICtjZmcuX3pwdW5zLmluZGV4T2YgIGQubGV0dGVyc1xuICAgIGNhc3RfcG51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gZGVjb2RlIGQubWFudGlzc2EsIGRpZ2l0c2V0XG4gICAgY2FzdF96ZXJvICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAwXG4gICAgY2FzdF9wYWRkaW5nICA9ICh7IGRhdGE6IGQsIHNvdXJjZSwgaGl0LCB9KSAtPiBkLmluZGV4ID0gMCBpZiBzb3VyY2UgaXMgaGl0XG4gICAgY2FzdF9vdGhlciAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGluY2x1ZGVfbmVnYXRpdmVzXG4gICAgICBudW5zX2xldHRlcnMgID0gX251bnNcbiAgICAgIG5tYWdfbGV0dGVycyAgPSBfbm1hZ1sgICAxIC4uICBdXG4gICAgICBmaXRfbnVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tudW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICAgIGZpdF9ubnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje25tYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2RpZ2l0c2V0fSAgXSogKSBcIlxuICAgICAgY2FzdF9udW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAoIGNmZy5fbnVucy5pbmRleE9mIGQubGV0dGVycyApIC0gY2ZnLl9udW5zLmxlbmd0aFxuICAgICAgY2FzdF9ubnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+XG4gICAgICAgIG1hbnRpc3NhICA9IGQubWFudGlzc2EucGFkU3RhcnQgY2ZnLmRpZ2l0c19wZXJfaWR4LCBtYXhfZGlnaXRcbiAgICAgICAgZC5pbmRleCAgID0gKCBkZWNvZGUgbWFudGlzc2EsIGRpZ2l0c2V0ICkgLSBjZmcuX21heF9pbnRlZ2VyXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICAgID0gbmV3IEdyYW1tYXIgeyBlbWl0X3NpZ25hbHM6IGZhbHNlLCB9XG4gICAgZmlyc3QgICAgICAgICA9IFIubmV3X2xldmVsIHsgbmFtZTogJ2ZpcnN0JywgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ251bicsICAgICAgZml0OiBmaXRfbnVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfbnVuLCAgICAgIH0gaWYgaW5jbHVkZV9uZWdhdGl2ZXNcbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwdW4nLCAgICAgIGZpdDogZml0X3B1biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3B1biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbm51bScsICAgICBmaXQ6IGZpdF9ubnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9ubnVtLCAgICAgfSBpZiBpbmNsdWRlX25lZ2F0aXZlc1xuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BudW0nLCAgICAgZml0OiBmaXRfcG51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcG51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwYWRkaW5nJywgIGZpdDogZml0X3BhZGRpbmcsICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BhZGRpbmcsICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnemVybycsICAgICBmaXQ6IGZpdF96ZXJvLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF96ZXJvLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ290aGVyJywgICAgZml0OiBmaXRfb3RoZXIsIG1lcmdlOiAnbGlzdCcsIGNhc3Q6IGNhc3Rfb3RoZXIsICAgIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGU6ICggaWR4X29yX3ZkeCApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICBAdHlwZXMuaWR4X29yX3ZkeC52YWxpZGF0ZSBpZHhfb3JfdmR4XG4gICAgc3dpdGNoIHR5cGUgPSBAdHlwZXMuaWR4X29yX3ZkeC5kYXRhLnR5cGVcbiAgICAgIHdoZW4gJ2lkeCcgdGhlbiByZXR1cm4gQGVuY29kZV9pZHggIGlkeF9vcl92ZHhcbiAgICAgIHdoZW4gJ3ZkeCcgdGhlbiByZXR1cm4gQF9lbmNvZGVfdmR4IGlkeF9vcl92ZHhcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzQgaW50ZXJuYWwgZXJyb3I6IHVua25vd24gdHlwZSAje3JwciB0eXBlfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfaWR4OiAoIGlkeCApIC0+IEBfZW5jb2RlX2lkeCBAdHlwZXMuaWR4LnZhbGlkYXRlIGlkeCwgQGNmZy5fbWluX2ludGVnZXIsIEBjZmcuX21heF9pbnRlZ2VyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZW5jb2RlX2lkeDogKCBpZHggKSAtPlxuICAgICMjIyBOT1RFIGNhbGwgb25seSB3aGVyZSBhc3N1cmVkIGBpZHhgIGlzIGludGVnZXIgd2l0aGluIG1hZ25pdHVkZSBvZiBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuICggQGNmZy5fenB1bnMuYXQgaWR4ICkgaWYgMCAgICAgICAgICAgICAgPD0gaWR4IDw9IEBjZmcuX21heF96cHVuICAjIFplcm8gb3Igc21hbGwgcG9zaXRpdmVcbiAgICByZXR1cm4gKCBAY2ZnLl9udW5zLmF0ICBpZHggKSBpZiBAY2ZnLl9taW5fbnVuICA8PSBpZHggPCAgMCAgICAgICAgICAgICAgICMgU21hbGwgbmVnYXRpdmVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGlkeCA+IEBjZmcuX21heF96cHVuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgQmlnIHBvc2l0aXZlXG4gICAgICBSID0gZW5jb2RlIGlkeCwgQGNmZy5kaWdpdHNldFxuICAgICAgcmV0dXJuICggQGNmZy5fcG1hZy5hdCBSLmxlbmd0aCApICsgUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgQGNmZy5jYXJkaW5hbHNfb25seVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX181IHVuYWJsZSB0byBlbmNvZGUgbmVnYXRpdmUgaWR4ICN7aWR4fSB3aXRoIGNhcmRpbmFscy1vbmx5IGNvZGVjXCJcbiAgICBSID0gKCBlbmNvZGUgKCBpZHggKyBAY2ZnLl9tYXhfaW50ZWdlciAgICAgKSwgQGNmZy5kaWdpdHNldCApICAgICAgICAgICAjIEJpZyBuZWdhdGl2ZVxuICAgIGlmIFIubGVuZ3RoIDwgQGNmZy5kaWdpdHNfcGVyX2lkeCB0aGVuIFIgPSBSLnBhZFN0YXJ0IEBjZmcuZGlnaXRzX3Blcl9pZHgsIEBjZmcuZGlnaXRzZXQuYXQgMFxuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSID0gUi5yZXBsYWNlIEBjZmcuX2xlYWRpbmdfbm92YXNfcmUsICcnXG4gICAgcmV0dXJuICggQGNmZy5fbm1hZy5hdCBSLmxlbmd0aCApICsgUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlX3ZkeDogKCB2ZHggKSAtPiBAX2VuY29kZV92ZHggQHR5cGVzLnZkeC52YWxpZGF0ZSB2ZHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9lbmNvZGVfdmR4OiAoIHZkeCApIC0+IFxcXG4gICAgKCAoIEBlbmNvZGVfaWR4IGlkeCBmb3IgaWR4IGluIHZkeCApLmpvaW4gJycgKS5wYWRFbmQgQGNmZy5fc29ydGtleV93aWR0aCwgQGNmZy5fY2lwaGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwYXJzZTogKCBzb3J0a2V5ICkgLT5cbiAgICBSID0gW11cbiAgICBmb3IgbGV4ZW1lIGluIEBsZXhlci5zY2FuX3RvX2xpc3Qgc29ydGtleVxuICAgICAgeyBuYW1lLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RvcCxcbiAgICAgICAgZGF0YSwgICAgICAgfSA9IGxleGVtZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB7IGxldHRlcnMsXG4gICAgICAgIG1hbnRpc3NhLFxuICAgICAgICBpbmRleCwgICAgICB9ID0gZGF0YVxuICAgICAgbGV0dGVycyAgICAgICAgID0gbGV0dGVycy5qb2luICcnIGlmICggdHlwZV9vZiBsZXR0ZXJzICkgaXMgJ2xpc3QnXG4gICAgICBtYW50aXNzYSAgICAgICA/PSBudWxsXG4gICAgICBpbmRleCAgICAgICAgICA/PSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIucHVzaCB7IG5hbWUsIGxldHRlcnMsIG1hbnRpc3NhLCBpbmRleCwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGU6ICggc29ydGtleSApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzb3J0a2V5ICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzYgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3Mgc29ydGtleS5sZW5ndGggPiAwXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzcgZXhwZWN0ZWQgYSBub24tZW1wdHkgdGV4dCwgZ290ICN7cnByIHNvcnRrZXl9XCJcbiAgICBSID0gW11cbiAgICBmb3IgdW5pdCBpbiBAcGFyc2Ugc29ydGtleVxuICAgICAgaWYgdW5pdC5uYW1lIGlzICdvdGhlcidcbiAgICAgICAgbWVzc2FnZSAgID0gXCLOqWhsbF9fXzggbm90IGEgdmFsaWQgc29ydGtleTogdW5hYmxlIHRvIHBhcnNlICN7cnByIHVuaXQubGV0dGVyc31cIlxuICAgICAgICBtZXNzYWdlICArPSBcIiBpbiAje3JwciBzb3J0a2V5fVwiIGlmIHNvcnRrZXkgaXNudCB1bml0LmxldHRlcnNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIG1lc3NhZ2VcbiAgICAgIFIucHVzaCB1bml0LmluZGV4IGlmIHVuaXQuaW5kZXg/XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZV9pbnRlZ2VyOiAoIG4gKSAtPlxuICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fOSBub3QgaW1wbGVtZW50ZWRcIlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaG9sbGVyaXRoXzEwICAgICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBcbiAgaG9sbGVyaXRoXzEwbXZwICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnBcbiAgaG9sbGVyaXRoXzEwbXZwMiAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnAyXG4gIGhvbGxlcml0aF8xMF9jYXJkaW5hbCA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwX2NhcmRpbmFsXG4gIGhvbGxlcml0aF8xMjggICAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOFxuICBob2xsZXJpdGhfMTI4XzE2MzgzICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhfMTYzODNcbiAgcmV0dXJuIHtcbiAgICBIb2xsZXJpdGgsXG4gICAgaG9sbGVyaXRoXzEwLFxuICAgIGhvbGxlcml0aF8xMG12cCxcbiAgICBob2xsZXJpdGhfMTBtdnAyLFxuICAgIGhvbGxlcml0aF8xMF9jYXJkaW5hbCxcbiAgICBob2xsZXJpdGhfMTI4LFxuICAgIGhvbGxlcml0aF8xMjhfMTYzODMsXG4gICAgdGVzdCxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
