(function() {
  'use strict';
  var Get_random, Hollerith_typespace, SFMODULES, Test_hollerith, debug, equals, internals, rpr, type_of, types;

  //===========================================================================================================
  ({debug} = console);

  //-----------------------------------------------------------------------------------------------------------
  SFMODULES = require('bricabrac-sfmodules');

  // SFMODULES                 = require 'bricabrac-sfmodules'
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
  internals = {
    //---------------------------------------------------------------------------------------------------------
    get_random_vdx_producer: function({seed = null, min_length = 1, max_length = 5, min_idx = -999, max_idx = +999} = {}) {
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
  };

  //===========================================================================================================
  Test_hollerith = class Test_hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(codec, n = 1000) {
      this.cfg = {n};
      this.codec = types.hollerith.validate(codec);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    * _walk_first_idxs(codec, delta, rnd_vdx_cfg, get_random) {
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
    test_sorting() {
      var R, _, first_idx, first_idx_walker, get_random, get_random_vdx, hit_count, i, idx, j, len, miss_count, probe_sortkey, probe_sub_count, probe_vdx, probes_sortkey, probes_vdx, ref, rnd_vdx_cfg, seed, sk, sort_by_sortkey, sort_by_vdx, vdx;
      rnd_vdx_cfg = {
        seed: null,
        min_length: 1,
        max_length: this.codec.cfg.dimension - 1,
        min_idx: Math.max(this.codec.cfg._min_integer, -2000),
        max_idx: Math.min(this.codec.cfg._max_integer, +2000)
      };
      //.......................................................................................................
      seed = 8475622;
      get_random = new Get_random({seed});
      get_random_vdx = internals.get_random_vdx_producer(rnd_vdx_cfg);
      probe_sub_count = 3;
      probes_sortkey = [];
      first_idx_walker = this._walk_first_idxs(this.codec, 500, rnd_vdx_cfg, get_random);
//.......................................................................................................
      for (first_idx of first_idx_walker) {
        for (_ = i = 1, ref = probe_sub_count; (1 <= ref ? i <= ref : i >= ref); _ = 1 <= ref ? ++i : --i) {
          vdx = [first_idx, ...get_random_vdx()];
          sk = this.codec.encode_vdx(vdx);
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
        miss_count,
        success: miss_count === 0
      };
      debug('Ωvdx___1', "testing results");
      debug('Ωvdx___2', R);
      return R;
    }

  };

  //===========================================================================================================
  module.exports = (() => {
    return {Test_hollerith, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Rlc3QtaG9sbGVyaXRoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxVQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsY0FBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTs7O0VBR0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1QixFQUhBOzs7RUFLQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSxxQkFBUixFQUw1Qjs7O0VBT0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLFVBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGtCQUFuQixDQUFBLENBQTVCLEVBVEE7OztFQVdBLENBQUEsQ0FBRSxtQkFBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSLENBQTVCOztFQUNBLEtBQUEsR0FBNEIsSUFBSSxtQkFBSixDQUFBOztFQUU1QixDQUFBLENBQUE7O0lBQUUsaUJBQUEsRUFBbUI7RUFBckIsQ0FBQSxHQUFrQyxPQUFBLENBQVEsV0FBUixDQUFsQyxFQWRBOzs7Ozs7Ozs7Ozs7Ozs7OztFQWlDQSxTQUFBLEdBR0UsQ0FBQTs7SUFBQSx1QkFBQSxFQUF5QixRQUFBLENBQUMsQ0FDeEIsSUFBQSxHQUFjLElBRFUsRUFFeEIsVUFBQSxHQUFjLENBRlUsRUFHeEIsVUFBQSxHQUFjLENBSFUsRUFJeEIsT0FBQSxHQUFjLENBQUMsR0FKUyxFQUt4QixPQUFBLEdBQWMsQ0FBQyxHQUxTLElBS0YsQ0FBQSxDQUxDLENBQUE7QUFN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QUFqQjtBQUFBLGlCQUFPLENBQUMsRUFBUjs7QUFDQSxlQUFPLENBQUM7TUFMVSxFQWxDeEI7O01BeUNJLFNBQUEsR0FBYztNQUNkLFVBQUEsR0FBYyxFQTFDbEI7O01BNENJLFVBQVUsQ0FBQyxJQUFYLENBQW9CLFdBQXBCO01BQ0EsY0FBYyxDQUFDLElBQWYsQ0FBb0IsZUFBcEI7TUFDQSxLQUFBLHdEQUFBOztRQUNFLGFBQUEsR0FBZ0IsY0FBYyxDQUFFLEdBQUY7UUFDOUIsSUFBRyxhQUFhLENBQUMsRUFBZCxLQUFvQixTQUFTLENBQUMsRUFBakM7VUFBMEMsU0FBQSxHQUExQztTQUFBLE1BQUE7VUFDMEMsVUFBQSxHQUQxQzs7TUFGRixDQTlDSjs7TUFtREksQ0FBQSxHQUFJO1FBQUUsV0FBQSxFQUFhLGNBQWMsQ0FBQyxNQUE5QjtRQUFzQyxTQUF0QztRQUFpRCxVQUFqRDtRQUE2RCxPQUFBLEVBQVcsVUFBQSxLQUFjO01BQXRGO01BQ0osS0FBQSxDQUFNLFVBQU4sRUFBa0IsaUJBQWxCO01BQ0EsS0FBQSxDQUFNLFVBQU4sRUFBa0IsQ0FBbEI7QUFDQSxhQUFPO0lBdkRLOztFQWxCaEIsRUFqREE7OztFQThIQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLENBQUEsQ0FBQSxHQUFBO1dBQUcsQ0FBRSxjQUFGLEVBQWtCLFNBQWxCO0VBQUgsQ0FBQTtBQTlIcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2Ztb2R1bGVzJ1xuIyBTRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNmbW9kdWxlcydcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbnsgR2V0X3JhbmRvbSwgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9nZXRfcmFuZG9tKClcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxueyBIb2xsZXJpdGhfdHlwZXNwYWNlLCAgfSA9IHJlcXVpcmUgJy4vdHlwZXMnXG50eXBlcyAgICAgICAgICAgICAgICAgICAgID0gbmV3IEhvbGxlcml0aF90eXBlc3BhY2UoKVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG57IGlzRGVlcFN0cmljdEVxdWFsOiBlcXVhbHMsICB9ID0gcmVxdWlyZSAnbm9kZTp1dGlsJ1xuXG5cbiMgeyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xuIyB7IEdyYW1tYXJcbiMgICBUb2tlblxuIyAgIExleGVtZSAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG4jIHsgY2xlYW5fYXNzaWduLCAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9jbGVhbl9hc3NpZ24oKVxuIyB7IGVuY29kZSxcbiMgICBkZWNvZGUsXG4jICAgbG9nX3RvX2Jhc2UsXG4jICAgZ2V0X3JlcXVpcmVkX2RpZ2l0cyxcbiMgICBnZXRfbWF4X2ludGVnZXIsICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxuIyB7IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG4jIHsgaGlkZSxcbiMgICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuaW50ZXJuYWxzID1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldF9yYW5kb21fdmR4X3Byb2R1Y2VyOiAoe1xuICAgIHNlZWQgICAgICAgID0gbnVsbCxcbiAgICBtaW5fbGVuZ3RoICA9IDEsXG4gICAgbWF4X2xlbmd0aCAgPSA1LFxuICAgIG1pbl9pZHggICAgID0gLTk5OSxcbiAgICBtYXhfaWR4ICAgICA9ICs5OTksIH09e30pIC0+XG4gICAgZ2V0X3JhbmRvbSAgICAgID0gbmV3IEdldF9yYW5kb20geyBzZWVkOiBudWxsLCBvbl9zdGF0czogbnVsbCwgfVxuICAgIGdldF9ybmRfbGVuZ3RoICA9IGdldF9yYW5kb20uaW50ZWdlcl9wcm9kdWNlciB7IG1pbjogbWluX2xlbmd0aCwgbWF4OiBtYXhfbGVuZ3RoLCB9XG4gICAgZ2V0X3JuZF9pZHggICAgID0gZ2V0X3JhbmRvbS5pbnRlZ2VyX3Byb2R1Y2VyIHsgbWluOiBtaW5faWR4LCAgICBtYXg6IG1heF9pZHgsICAgIH1cbiAgICByZXR1cm4gZ2V0X3JuZF92ZHggPSAtPiAoIGdldF9ybmRfaWR4KCkgZm9yIF8gaW4gWyAxIC4uIGdldF9ybmRfbGVuZ3RoKCkgXSApXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBUZXN0X2hvbGxlcml0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY29kZWMsIG4gPSAxMDAwICkgLT5cbiAgICBAY2ZnICAgID0geyBuLCB9XG4gICAgQGNvZGVjICA9IHR5cGVzLmhvbGxlcml0aC52YWxpZGF0ZSBjb2RlY1xuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF93YWxrX2ZpcnN0X2lkeHM6ICggY29kZWMsIGRlbHRhLCBybmRfdmR4X2NmZywgZ2V0X3JhbmRvbSApIC0+XG4gICAgeWllbGQgaWR4IGZvciBpZHggaW4gWyBjb2RlYy5jZmcuX21pbl9pbnRlZ2VyICAgICAgICAgLi4gY29kZWMuY2ZnLl9taW5faW50ZWdlciArIGRlbHRhIF1cbiAgICB5aWVsZCBpZHggZm9yIGlkeCBpbiBbIHJuZF92ZHhfY2ZnLm1pbl9pZHggICAgICAgICAgICAuLiBybmRfdmR4X2NmZy5tYXhfaWR4ICAgICAgICAgICAgXVxuICAgIHlpZWxkIGlkeCBmb3IgaWR4IGluIFsgY29kZWMuY2ZnLl9tYXhfaW50ZWdlciAtIGRlbHRhIC4uIGNvZGVjLmNmZy5fbWF4X2ludGVnZXIgICAgICAgICBdXG4gICAgZ2V0X3JhbmRvbV9pZHggPSBnZXRfcmFuZG9tLmludGVnZXJfcHJvZHVjZXIgeyBtaW46IHJuZF92ZHhfY2ZnLm1pbl9pZHgsIG1heDogcm5kX3ZkeF9jZmcubWF4X2lkeCwgfVxuICAgIHlpZWxkIGdldF9yYW5kb21faWR4KCkgZm9yIF8gaW4gWyAxIC4uIDEwMDAgXVxuICAgIHJldHVybiBudWxsXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0ZXN0X3NvcnRpbmc6IC0+XG4gICAgcm5kX3ZkeF9jZmcgICAgICAgICAgICAgICAgID1cbiAgICAgIHNlZWQ6ICAgICAgICAgbnVsbFxuICAgICAgbWluX2xlbmd0aDogICAxXG4gICAgICBtYXhfbGVuZ3RoOiAgIEBjb2RlYy5jZmcuZGltZW5zaW9uIC0gMVxuICAgICAgbWluX2lkeDogICAgICBNYXRoLm1heCBAY29kZWMuY2ZnLl9taW5faW50ZWdlciwgLTIwMDBcbiAgICAgIG1heF9pZHg6ICAgICAgTWF0aC5taW4gQGNvZGVjLmNmZy5fbWF4X2ludGVnZXIsICsyMDAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzZWVkICAgICAgICAgICAgICAgICAgICAgICAgPSA4NDc1NjIyXG4gICAgZ2V0X3JhbmRvbSAgICAgICAgICAgICAgICAgID0gbmV3IEdldF9yYW5kb20geyBzZWVkLCB9XG4gICAgZ2V0X3JhbmRvbV92ZHggICAgICAgICAgICAgID0gaW50ZXJuYWxzLmdldF9yYW5kb21fdmR4X3Byb2R1Y2VyIHJuZF92ZHhfY2ZnXG4gICAgcHJvYmVfc3ViX2NvdW50ICAgICAgICAgICAgID0gM1xuICAgIHByb2Jlc19zb3J0a2V5ICAgICAgICAgICAgICA9IFtdXG4gICAgZmlyc3RfaWR4X3dhbGtlciAgICAgICAgICAgID0gQF93YWxrX2ZpcnN0X2lkeHMgQGNvZGVjLCA1MDAsIHJuZF92ZHhfY2ZnLCBnZXRfcmFuZG9tXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmb3IgZmlyc3RfaWR4IGZyb20gZmlyc3RfaWR4X3dhbGtlclxuICAgICAgZm9yIF8gaW4gWyAxIC4uIHByb2JlX3N1Yl9jb3VudCBdXG4gICAgICAgIHZkeCA9IFsgZmlyc3RfaWR4LCBnZXRfcmFuZG9tX3ZkeCgpLi4uLCBdXG4gICAgICAgIHNrICA9IEBjb2RlYy5lbmNvZGVfdmR4IHZkeFxuICAgICAgICBwcm9iZXNfc29ydGtleS5wdXNoIHsgdmR4LCBzaywgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcHJvYmVzX3NvcnRrZXkgICAgPSBnZXRfcmFuZG9tLnNodWZmbGUgcHJvYmVzX3NvcnRrZXlcbiAgICBwcm9iZXNfdmR4ICAgICAgICA9IHByb2Jlc19zb3J0a2V5WyAuLiBdXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzb3J0X2J5X3ZkeCAgICAgICA9ICggYSwgYiApIC0+XG4gICAgICBhID0gYS52ZHhcbiAgICAgIGIgPSBiLnZkeFxuICAgICAgZm9yIGlkeCBpbiBbIDAgLi4uICggTWF0aC5tYXggYS5sZW5ndGgsIGIubGVuZ3RoICkgXVxuICAgICAgICBkYSA9IGFbIGlkeCBdID8gMFxuICAgICAgICBkYiA9IGJbIGlkeCBdID8gMFxuICAgICAgICBjb250aW51ZSBpZiBkYSBpcyBkYlxuICAgICAgICByZXR1cm4gLTEgaWYgZGEgPCBkYlxuICAgICAgICByZXR1cm4gKzFcbiAgICAgIHJldHVybiBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzb3J0X2J5X3NvcnRrZXkgICA9ICggYSwgYiApIC0+XG4gICAgICBhID0gYS5za1xuICAgICAgYiA9IGIuc2tcbiAgICAgIHJldHVybiAgMCBpZiBhIGlzIGJcbiAgICAgIHJldHVybiAtMSBpZiBhIDwgYlxuICAgICAgcmV0dXJuICsxXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBoaXRfY291bnQgICA9IDBcbiAgICBtaXNzX2NvdW50ICA9IDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHByb2Jlc192ZHguc29ydCAgICAgc29ydF9ieV92ZHhcbiAgICBwcm9iZXNfc29ydGtleS5zb3J0IHNvcnRfYnlfc29ydGtleVxuICAgIGZvciBwcm9iZV92ZHgsIGlkeCBpbiBwcm9iZXNfdmR4XG4gICAgICBwcm9iZV9zb3J0a2V5ID0gcHJvYmVzX3NvcnRrZXlbIGlkeCBdXG4gICAgICBpZiBwcm9iZV9zb3J0a2V5LnNrIGlzIHByb2JlX3ZkeC5zayB0aGVuICBoaXRfY291bnQrK1xuICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWlzc19jb3VudCsrXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSID0geyBwcm9iZV9jb3VudDogcHJvYmVzX3NvcnRrZXkubGVuZ3RoLCBoaXRfY291bnQsIG1pc3NfY291bnQsIHN1Y2Nlc3M6ICggbWlzc19jb3VudCBpcyAwICksIH1cbiAgICBkZWJ1ZyAnzql2ZHhfX18xJywgXCJ0ZXN0aW5nIHJlc3VsdHNcIlxuICAgIGRlYnVnICfOqXZkeF9fXzInLCBSXG4gICAgcmV0dXJuIFJcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT4geyBUZXN0X2hvbGxlcml0aCwgaW50ZXJuYWxzLCB9XG4iXX0=
