(function() {
  'use strict';
  var Get_random, Hollerith_typespace, SFMODULES, debug, equals, rpr, test_hollerith, type_of, types;

  //===========================================================================================================
  ({debug} = console);

  //-----------------------------------------------------------------------------------------------------------
  SFMODULES = require('../../bricabrac-single-file-modules');

  // SFMODULES                 = require 'bricabrac-single-file-modules'
  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({Get_random} = SFMODULES.unstable.require_get_random());

  //-----------------------------------------------------------------------------------------------------------
  ({Hollerith_typespace} = require('./types'));

  types = new Hollerith_typespace();

  ({
    //-----------------------------------------------------------------------------------------------------------
    isDeepStrictEqual: equals
  } = require('node:util'));

  // { regex,                } = require 'regex'
  // { Grammar
  //   Token
  //   Lexeme                } = require 'interlex'
  // { clean_assign,         } = SFMODULES.unstable.require_clean_assign()
  // { encode,
  //   decode,
  //   log_to_base,
  //   get_required_digits,
  //   get_max_integer,      } = SFMODULES.unstable.require_anybase()
  // { freeze,               } = Object
  // { hide,
  //   set_getter,           } = SFMODULES.require_managed_property_tools()

    //===========================================================================================================
  test_hollerith = class test_hollerith {
    //---------------------------------------------------------------------------------------------------------
    static get_random_vdx_producer({seed = null, min_length = 1, max_length = 5, min_idx = -999, max_idx = +999} = {}) {
      var get_random, get_rnd_idx, get_rnd_length, get_rnd_vdx;
      get_random = new Get_random({
        seed: null,
        on_stats: null
      });
      get_rnd_length = get_random.integer_producer({
        min: min_length,
        max: max_length
      });
      get_rnd_idx = get_random.integer_producer({
        min: min_idx,
        max: max_idx
      });
      return get_rnd_vdx = function() {
        var _, i, ref, results;
        results = [];
        for (_ = i = 1, ref = get_rnd_length(); (1 <= ref ? i <= ref : i >= ref); _ = 1 <= ref ? ++i : --i) {
          results.push(get_rnd_idx());
        }
        return results;
      };
    }

    //---------------------------------------------------------------------------------------------------------
    static test_sorting(codec) {
      var R;
      types.hollerith.validate(codec);
      R = {
        success: true
      };
      //.......................................................................................................
      Object.assign(R, this._test_sorting(codec));
      //.......................................................................................................
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    static * _walk_first_idxs(codec, delta, rnd_vdx_cfg, get_random) {
      var _, get_random_idx, i, idx, j, k, l, ref, ref1, ref2, ref3, ref4, ref5;
      for (idx = i = ref = codec.cfg._min_integer, ref1 = codec.cfg._min_integer + delta; (ref <= ref1 ? i <= ref1 : i >= ref1); idx = ref <= ref1 ? ++i : --i) {
        yield idx;
      }
      for (idx = j = ref2 = rnd_vdx_cfg.min_idx, ref3 = rnd_vdx_cfg.max_idx; (ref2 <= ref3 ? j <= ref3 : j >= ref3); idx = ref2 <= ref3 ? ++j : --j) {
        yield idx;
      }
      for (idx = k = ref4 = codec.cfg._max_integer - delta, ref5 = codec.cfg._max_integer; (ref4 <= ref5 ? k <= ref5 : k >= ref5); idx = ref4 <= ref5 ? ++k : --k) {
        yield idx;
      }
      get_random_idx = get_random.integer_producer({
        min: rnd_vdx_cfg.min_idx,
        max: rnd_vdx_cfg.max_idx
      });
      for (_ = l = 1; l <= 1000; _ = ++l) {
        yield get_random_idx();
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    static _test_sorting(codec) {
      var R, _, encode, first_idx, first_idx_walker, get_random, get_random_vdx, hit_count, i, idx, j, len, miss_count, probe_sortkey, probe_sub_count, probe_vdx, probes_sortkey, probes_vdx, ref, rnd_vdx_cfg, seed, sk, sort_by_sortkey, sort_by_vdx, vdx;
      rnd_vdx_cfg = {
        seed: null,
        min_length: 1,
        max_length: codec.cfg.dimension - 1,
        min_idx: Math.max(codec.cfg._min_integer, -2000),
        max_idx: Math.min(codec.cfg._max_integer, +2000)
      };
      //.......................................................................................................
      seed = 8475622;
      get_random = new Get_random({seed});
      get_random_vdx = this.get_random_vdx_producer(rnd_vdx_cfg);
      probe_sub_count = 3;
      encode = function(vdx) {
        return (codec.encode(vdx)).padEnd(codec.cfg._sortkey_width, codec.cfg._cipher);
      };
      probes_sortkey = [];
      first_idx_walker = this._walk_first_idxs(codec, 500, rnd_vdx_cfg, get_random);
//.......................................................................................................
      for (first_idx of first_idx_walker) {
        for (_ = i = 1, ref = probe_sub_count; (1 <= ref ? i <= ref : i >= ref); _ = 1 <= ref ? ++i : --i) {
          vdx = [first_idx, ...get_random_vdx()];
          sk = encode(vdx);
          probes_sortkey.push({vdx, sk});
        }
      }
      //.......................................................................................................
      probes_sortkey = get_random.shuffle(probes_sortkey);
      probes_vdx = probes_sortkey.slice(0);
      //.......................................................................................................
      sort_by_vdx = function(a, b) {
        var da, db, idx, j, ref1, ref2, ref3;
        a = a.vdx;
        b = b.vdx;
        for (idx = j = 0, ref1 = Math.max(a.length, b.length); (0 <= ref1 ? j < ref1 : j > ref1); idx = 0 <= ref1 ? ++j : --j) {
          da = (ref2 = a[idx]) != null ? ref2 : 0;
          db = (ref3 = b[idx]) != null ? ref3 : 0;
          if (da === db) {
            continue;
          }
          if (da < db) {
            return -1;
          }
          return +1;
        }
        return null;
      };
      //.......................................................................................................
      sort_by_sortkey = function(a, b) {
        a = a.sk;
        b = b.sk;
        if (a === b) {
          return 0;
        }
        if (a < b) {
          return -1;
        }
        return +1;
      };
      //.......................................................................................................
      hit_count = 0;
      miss_count = 0;
      //.......................................................................................................
      probes_vdx.sort(sort_by_vdx);
      probes_sortkey.sort(sort_by_sortkey);
      for (idx = j = 0, len = probes_vdx.length; j < len; idx = ++j) {
        probe_vdx = probes_vdx[idx];
        probe_sortkey = probes_sortkey[idx];
        if (probe_sortkey.sk === probe_vdx.sk) {
          hit_count++;
        } else {
          miss_count++;
        }
      }
      //.......................................................................................................
      R = {
        probe_count: probes_sortkey.length,
        hit_count,
        miss_count
      };
      debug('Ωvdx___1', "testing results");
      debug('Ωvdx___2', R);
      return R;
    }

  };

  //===========================================================================================================
  module.exports = (() => {
    return {test_hollerith};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Rlc3QtaG9sbGVyaXRoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsY0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBOzs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCLEVBSEE7OztFQUtBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLHFDQUFSLEVBTDVCOzs7RUFPQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsVUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsa0JBQW5CLENBQUEsQ0FBNUIsRUFUQTs7O0VBV0EsQ0FBQSxDQUFFLG1CQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLFNBQVIsQ0FBNUI7O0VBQ0EsS0FBQSxHQUE0QixJQUFJLG1CQUFKLENBQUE7O0VBRTVCLENBQUEsQ0FBQTs7SUFBRSxpQkFBQSxFQUFtQjtFQUFyQixDQUFBLEdBQWtDLE9BQUEsQ0FBUSxXQUFSLENBQWxDLEVBZEE7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBaUNNLGlCQUFOLE1BQUEsZUFBQSxDQUFBOztJQUc0QixPQUF6Qix1QkFBeUIsQ0FBQyxDQUN6QixJQUFBLEdBQWMsSUFEVyxFQUV6QixVQUFBLEdBQWMsQ0FGVyxFQUd6QixVQUFBLEdBQWMsQ0FIVyxFQUl6QixPQUFBLEdBQWMsQ0FBQyxHQUpVLEVBS3pCLE9BQUEsR0FBYyxDQUFDLEdBTFUsSUFLSCxDQUFBLENBTEUsQ0FBQTtBQU01QixVQUFB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QUFvQixRQUFBLENBQUUsQ0FBRixFQUFLLENBQUwsQ0FBQTtRQUNsQixDQUFBLEdBQUksQ0FBQyxDQUFDO1FBQ04sQ0FBQSxHQUFJLENBQUMsQ0FBQztRQUNOLElBQWEsQ0FBQSxLQUFLLENBQWxCO0FBQUEsaUJBQVEsRUFBUjs7UUFDQSxJQUFhLENBQUEsR0FBSSxDQUFqQjtBQUFBLGlCQUFPLENBQUMsRUFBUjs7QUFDQSxlQUFPLENBQUM7TUFMVSxFQW5DeEI7O01BMENJLFNBQUEsR0FBYztNQUNkLFVBQUEsR0FBYyxFQTNDbEI7O01BNkNJLFVBQVUsQ0FBQyxJQUFYLENBQW9CLFdBQXBCO01BQ0EsY0FBYyxDQUFDLElBQWYsQ0FBb0IsZUFBcEI7TUFDQSxLQUFBLHdEQUFBOztRQUNFLGFBQUEsR0FBZ0IsY0FBYyxDQUFFLEdBQUY7UUFDOUIsSUFBRyxhQUFhLENBQUMsRUFBZCxLQUFvQixTQUFTLENBQUMsRUFBakM7VUFBMEMsU0FBQSxHQUExQztTQUFBLE1BQUE7VUFDMEMsVUFBQSxHQUQxQzs7TUFGRixDQS9DSjs7TUFvREksQ0FBQSxHQUFJO1FBQUUsV0FBQSxFQUFhLGNBQWMsQ0FBQyxNQUE5QjtRQUFzQyxTQUF0QztRQUFpRDtNQUFqRDtNQUNKLEtBQUEsQ0FBTSxVQUFOLEVBQWtCLGlCQUFsQjtNQUNBLEtBQUEsQ0FBTSxVQUFOLEVBQWtCLENBQWxCO0FBQ0EsYUFBTztJQXhETzs7RUFsQ2xCLEVBakNBOzs7RUErSEEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtXQUFHLENBQUUsY0FBRjtFQUFILENBQUE7QUEvSHBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi4vLi4vYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG4jIFNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2luZ2xlLWZpbGUtbW9kdWxlcydcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbnsgR2V0X3JhbmRvbSwgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9nZXRfcmFuZG9tKClcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBIb2xsZXJpdGhfdHlwZXNwYWNlLCAgfSA9IHJlcXVpcmUgJy4vdHlwZXMnXG50eXBlcyAgICAgICAgICAgICAgICAgICAgID0gbmV3IEhvbGxlcml0aF90eXBlc3BhY2UoKVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IGlzRGVlcFN0cmljdEVxdWFsOiBlcXVhbHMsICB9ID0gcmVxdWlyZSAnbm9kZTp1dGlsJ1xuXG5cbiMgeyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xuIyB7IEdyYW1tYXJcbiMgICBUb2tlblxuIyAgIExleGVtZSAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG4jIHsgY2xlYW5fYXNzaWduLCAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9jbGVhbl9hc3NpZ24oKVxuIyB7IGVuY29kZSxcbiMgICBkZWNvZGUsXG4jICAgbG9nX3RvX2Jhc2UsXG4jICAgZ2V0X3JlcXVpcmVkX2RpZ2l0cyxcbiMgICBnZXRfbWF4X2ludGVnZXIsICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxuIyB7IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG4jIHsgaGlkZSxcbiMgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgdGVzdF9ob2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBnZXRfcmFuZG9tX3ZkeF9wcm9kdWNlcjogKHtcbiAgICBzZWVkICAgICAgICA9IG51bGwsXG4gICAgbWluX2xlbmd0aCAgPSAxLFxuICAgIG1heF9sZW5ndGggID0gNSxcbiAgICBtaW5faWR4ICAgICA9IC05OTksXG4gICAgbWF4X2lkeCAgICAgPSArOTk5LCB9PXt9KSAtPlxuICAgIGdldF9yYW5kb20gICAgICA9IG5ldyBHZXRfcmFuZG9tIHsgc2VlZDogbnVsbCwgb25fc3RhdHM6IG51bGwsIH1cbiAgICBnZXRfcm5kX2xlbmd0aCAgPSBnZXRfcmFuZG9tLmludGVnZXJfcHJvZHVjZXIgeyBtaW46IG1pbl9sZW5ndGgsIG1heDogbWF4X2xlbmd0aCwgfVxuICAgIGdldF9ybmRfaWR4ICAgICA9IGdldF9yYW5kb20uaW50ZWdlcl9wcm9kdWNlciB7IG1pbjogbWluX2lkeCwgICAgbWF4OiBtYXhfaWR4LCAgICB9XG4gICAgcmV0dXJuIGdldF9ybmRfdmR4ID0gLT4gKCBnZXRfcm5kX2lkeCgpIGZvciBfIGluIFsgMSAuLiBnZXRfcm5kX2xlbmd0aCgpIF0gKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHRlc3Rfc29ydGluZzogKCBjb2RlYyApIC0+XG4gICAgdHlwZXMuaG9sbGVyaXRoLnZhbGlkYXRlIGNvZGVjXG4gICAgUiA9XG4gICAgICBzdWNjZXNzOiB0cnVlXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBPYmplY3QuYXNzaWduIFIsIEBfdGVzdF9zb3J0aW5nIGNvZGVjXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQF93YWxrX2ZpcnN0X2lkeHM6ICggY29kZWMsIGRlbHRhLCBybmRfdmR4X2NmZywgZ2V0X3JhbmRvbSApIC0+XG4gICAgeWllbGQgaWR4IGZvciBpZHggaW4gWyBjb2RlYy5jZmcuX21pbl9pbnRlZ2VyICAgICAgICAgLi4gY29kZWMuY2ZnLl9taW5faW50ZWdlciArIGRlbHRhIF1cbiAgICB5aWVsZCBpZHggZm9yIGlkeCBpbiBbIHJuZF92ZHhfY2ZnLm1pbl9pZHggICAgICAgICAgICAuLiBybmRfdmR4X2NmZy5tYXhfaWR4ICAgICAgICAgICAgXVxuICAgIHlpZWxkIGlkeCBmb3IgaWR4IGluIFsgY29kZWMuY2ZnLl9tYXhfaW50ZWdlciAtIGRlbHRhIC4uIGNvZGVjLmNmZy5fbWF4X2ludGVnZXIgICAgICAgICBdXG4gICAgZ2V0X3JhbmRvbV9pZHggPSBnZXRfcmFuZG9tLmludGVnZXJfcHJvZHVjZXIgeyBtaW46IHJuZF92ZHhfY2ZnLm1pbl9pZHgsIG1heDogcm5kX3ZkeF9jZmcubWF4X2lkeCwgfVxuICAgIHlpZWxkIGdldF9yYW5kb21faWR4KCkgZm9yIF8gaW4gWyAxIC4uIDEwMDAgXVxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAX3Rlc3Rfc29ydGluZzogKCBjb2RlYyApIC0+XG4gICAgcm5kX3ZkeF9jZmcgICAgICAgICAgICAgICAgID1cbiAgICAgIHNlZWQ6ICAgICAgICAgbnVsbFxuICAgICAgbWluX2xlbmd0aDogICAxXG4gICAgICBtYXhfbGVuZ3RoOiAgIGNvZGVjLmNmZy5kaW1lbnNpb24gLSAxXG4gICAgICBtaW5faWR4OiAgICAgIE1hdGgubWF4IGNvZGVjLmNmZy5fbWluX2ludGVnZXIsIC0yMDAwXG4gICAgICBtYXhfaWR4OiAgICAgIE1hdGgubWluIGNvZGVjLmNmZy5fbWF4X2ludGVnZXIsICsyMDAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzZWVkICAgICAgICAgICAgICAgICAgICAgICAgPSA4NDc1NjIyXG4gICAgZ2V0X3JhbmRvbSAgICAgICAgICAgICAgICAgID0gbmV3IEdldF9yYW5kb20geyBzZWVkLCB9XG4gICAgZ2V0X3JhbmRvbV92ZHggICAgICAgICAgICAgID0gQGdldF9yYW5kb21fdmR4X3Byb2R1Y2VyIHJuZF92ZHhfY2ZnXG4gICAgcHJvYmVfc3ViX2NvdW50ICAgICAgICAgICAgID0gM1xuICAgIGVuY29kZSAgICAgICAgICAgICAgICAgICAgICA9ICggdmR4ICkgLT4gKCBjb2RlYy5lbmNvZGUgdmR4ICkucGFkRW5kIGNvZGVjLmNmZy5fc29ydGtleV93aWR0aCwgY29kZWMuY2ZnLl9jaXBoZXJcbiAgICBwcm9iZXNfc29ydGtleSAgICAgICAgICAgICAgPSBbXVxuICAgIGZpcnN0X2lkeF93YWxrZXIgICAgICAgICAgICA9IEBfd2Fsa19maXJzdF9pZHhzIGNvZGVjLCA1MDAsIHJuZF92ZHhfY2ZnLCBnZXRfcmFuZG9tXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZmlyc3RfaWR4IGZyb20gZmlyc3RfaWR4X3dhbGtlclxuICAgICAgZm9yIF8gaW4gWyAxIC4uIHByb2JlX3N1Yl9jb3VudCBdXG4gICAgICAgIHZkeCA9IFsgZmlyc3RfaWR4LCBnZXRfcmFuZG9tX3ZkeCgpLi4uLCBdXG4gICAgICAgIHNrICA9IGVuY29kZSB2ZHhcbiAgICAgICAgcHJvYmVzX3NvcnRrZXkucHVzaCB7IHZkeCwgc2ssIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHByb2Jlc19zb3J0a2V5ICAgID0gZ2V0X3JhbmRvbS5zaHVmZmxlIHByb2Jlc19zb3J0a2V5XG4gICAgcHJvYmVzX3ZkeCAgICAgICAgPSBwcm9iZXNfc29ydGtleVsgLi4gXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc29ydF9ieV92ZHggICAgICAgPSAoIGEsIGIgKSAtPlxuICAgICAgYSA9IGEudmR4XG4gICAgICBiID0gYi52ZHhcbiAgICAgIGZvciBpZHggaW4gWyAwIC4uLiAoIE1hdGgubWF4IGEubGVuZ3RoLCBiLmxlbmd0aCApIF1cbiAgICAgICAgZGEgPSBhWyBpZHggXSA/IDBcbiAgICAgICAgZGIgPSBiWyBpZHggXSA/IDBcbiAgICAgICAgY29udGludWUgaWYgZGEgaXMgZGJcbiAgICAgICAgcmV0dXJuIC0xIGlmIGRhIDwgZGJcbiAgICAgICAgcmV0dXJuICsxXG4gICAgICByZXR1cm4gbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc29ydF9ieV9zb3J0a2V5ICAgPSAoIGEsIGIgKSAtPlxuICAgICAgYSA9IGEuc2tcbiAgICAgIGIgPSBiLnNrXG4gICAgICByZXR1cm4gIDAgaWYgYSBpcyBiXG4gICAgICByZXR1cm4gLTEgaWYgYSA8IGJcbiAgICAgIHJldHVybiArMVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaGl0X2NvdW50ICAgPSAwXG4gICAgbWlzc19jb3VudCAgPSAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBwcm9iZXNfdmR4LnNvcnQgICAgIHNvcnRfYnlfdmR4XG4gICAgcHJvYmVzX3NvcnRrZXkuc29ydCBzb3J0X2J5X3NvcnRrZXlcbiAgICBmb3IgcHJvYmVfdmR4LCBpZHggaW4gcHJvYmVzX3ZkeFxuICAgICAgcHJvYmVfc29ydGtleSA9IHByb2Jlc19zb3J0a2V5WyBpZHggXVxuICAgICAgaWYgcHJvYmVfc29ydGtleS5zayBpcyBwcm9iZV92ZHguc2sgdGhlbiAgaGl0X2NvdW50KytcbiAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pc3NfY291bnQrK1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiA9IHsgcHJvYmVfY291bnQ6IHByb2Jlc19zb3J0a2V5Lmxlbmd0aCwgaGl0X2NvdW50LCBtaXNzX2NvdW50LCB9XG4gICAgZGVidWcgJ86pdmR4X19fMScsIFwidGVzdGluZyByZXN1bHRzXCJcbiAgICBkZWJ1ZyAnzql2ZHhfX18yJywgUlxuICAgIHJldHVybiBSXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+IHsgdGVzdF9ob2xsZXJpdGgsIH1cbiJdfQ==
