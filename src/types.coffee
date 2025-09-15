
'use strict'

#===========================================================================================================
SFMODULES                 = require '../../bricabrac-single-file-modules'
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ debug,                } = console
{ regex,                } = require 'regex'
{ freeze,               } = Object
{ Type,
  Typespace,
  CFG,                  } = SFMODULES.unstable.require_nanotypes()
{ is_positive_integer_power_of,
  is_positive_all_niner,
  get_max_integer,
  # get_max_niner_digit_count,
  # encode,
  # decode,
  # log_to_base,
  # get_required_digits,
                        } = SFMODULES.unstable.require_anybase()


#===========================================================================================================
internals = Object.assign { Type, Typespace, },

  #---------------------------------------------------------------------------------------------------------
  get_leading_novas_re: ( _nova ) -> ( regex 'g' )""" ^ #{_nova}* (?= .+ $ ) """



#===========================================================================================================
# HOLLERITH TYPESPACE
#===========================================================================================================
class Hollerith_typespace extends Typespace

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    super cfg
    @blank.validate @[CFG].blank
    blank_esc       = RegExp.escape @[CFG].blank
    blank_splitter  = new RegExp "(?:#{blank_esc})+", 'gv'
    @[CFG]          = freeze { @[CFG]..., blank_splitter, }
    return undefined


  #=========================================================================================================
  @[CFG]:
    blank: ' '

  #=========================================================================================================
  @boolean:         ( x ) -> ( x is false ) or ( x is true )
  @list:            ( x ) -> ( type_of x ) is 'list'
  @text:            ( x ) -> ( type_of x ) is 'text'
  @nonempty_text:   ( x ) -> ( @T.text.isa x ) and ( x.length > 0 )
  @character:       ( x ) -> ( @T.text.isa x ) and ( /^.$/v.test x )
  @float:           ( x ) -> Number.isFinite x
  @integer:         ( x ) -> Number.isSafeInteger x
  @pinteger:        ( x ) -> ( @T.integer.isa x ) and ( x >  0 )
  @zpinteger:       ( x ) -> ( @T.integer.isa x ) and ( x >= 0 )
  @cardinal:        ( x ) -> @T.zpinteger.isa x
  #---------------------------------------------------------------------------------------------------------
  ### NOTE requiring `x` to be both a character and equal to `@[CFG].blank` means `@[CFG].blank` itself can be tested ###
  @blank:           ( x ) -> ( @T.character.isa x ) and ( x is @[CFG].blank )
  @dimension:       ( x ) -> ( @T.pinteger.isa  x )
  @cardinals_only:  ( x ) -> ( @T.boolean.isa   x )
  @_base:           ( x ) -> ( @T.pinteger.isa  x ) and ( x > 1 )
  # @digits_per_idx:  ( x ) -> ( @T.pinteger.isa x ) and ( x > 1 )

  #---------------------------------------------------------------------------------------------------------
  @incremental_text: ( x ) ->
    return false unless @T.text.isa x
    @assign { chrs: ( freeze Array.from x ), }
    return _test_monotony.call @, x, '<'

  #---------------------------------------------------------------------------------------------------------
  @decremental_text: ( x ) ->
    return false unless @T.text.isa x
    @assign { chrs: ( freeze Array.from x ), }
    return _test_monotony.call @, x, '>'

  #---------------------------------------------------------------------------------------------------------
  @nmag_bare_reversed:  ( x ) -> @T.incremental_text.dm_isa @data, null, x
  @pmag_bare:           ( x ) -> @T.incremental_text.dm_isa @data, null, x

  #---------------------------------------------------------------------------------------------------------
  @magnifiers: ( x, { cardinals_only = false }={} ) ->
    return ( @fail "expected a magnifier, got an empty text" ) unless @T.nonempty_text.isa x
    parts = x.split @[CFG].blank_splitter
    if cardinals_only
      unless parts.length in [ 1, 2, ]
        return ( @fail "magnifiers for { cardinals_only: true } must have 0 or 1 blank, got #{parts.length - 1} blanks")
    else
      unless parts.length is 2
        return ( @fail "magnifiers for { cardinals_only: false } must have exactly 1 blank, got #{parts.length - 1} blanks")
    if parts.length is 1
      [ nmag_bare_reversed,
        pmag_bare,          ] = [ null, parts..., ]
    else
      [ nmag_bare_reversed,
        pmag_bare,          ] = parts
    #.......................................................................................................
    if cardinals_only
      return ( @fail "Ωbsk___3 ???" ) unless  @T.pmag_bare.dm_isa          @data, { chrs: '_pmag_list', },          pmag_bare
      _nmag       = null
      _pmag       = @[CFG].blank + pmag_bare
      _nmag_list  = null
      _pmag_list  = freeze Array.from _pmag
    #.......................................................................................................
    else
      return ( @fail "Ωbsk___6 ???" ) unless  @T.nmag_bare_reversed.dm_isa @data, { chrs: 'nmag_chrs_reversed', },  nmag_bare_reversed
      return ( @fail "Ωbsk___7 ???" ) unless  @T.pmag_bare.dm_isa          @data, { chrs: '_pmag_list', },          pmag_bare
      return ( @fail "Ωbsk___8 ???" ) unless  @T.incremental_text.isa                                               nmag_bare_reversed + pmag_bare
      return ( @fail "Ωbsk___9 ???" ) unless  nmag_bare_reversed.length is pmag_bare.length
      _nmag       = @[CFG].blank + [ @data.nmag_chrs_reversed..., ].reverse().join ''
      _pmag       = @[CFG].blank + pmag_bare
      _nmag_list  = freeze Array.from _nmag
      _pmag_list  = freeze Array.from _pmag
    #.......................................................................................................
    @assign { _nmag, _pmag, _nmag_list, _pmag_list, }
    return true

  #---------------------------------------------------------------------------------------------------------
  @digitset: ( x ) ->
    return false unless @T.incremental_text.dm_isa @data, { chrs: '_digits_list', }, x
    _base             = @data._digits_list.length
    return @fail "an digitset must have 2 chrs or more" unless @T._base.isa _base
    _naught           = @data._digits_list.at  0
    _nova             = @data._digits_list.at -1
    _leading_novas_re = internals.get_leading_novas_re _nova
    @assign { _base, _naught, _nova, _leading_novas_re, }
    return true

  #---------------------------------------------------------------------------------------------------------
  @uniliterals: ( x, { cardinals_only = false, }={} ) ->
    return false unless @T.nonempty_text.isa x
    if @T.character.isa x
      _nuns       = null
      _zpuns      = x
      _cipher     = x
      _nuns_list  = freeze [] # null !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      _zpuns_list = freeze [ x, ]
      @assign { _nuns, _zpuns, _nuns_list, _zpuns_list, _cipher, }
      return true
    #.......................................................................................................
    parts = x.split @[CFG].blank_splitter
    #.......................................................................................................
    if cardinals_only
      unless parts.length in [ 2, 3, ]
        return @fail "uniliterals for { cardinals_only: true } that are not a single character must have 1 or 2 blanks, got #{parts.length - 1} blanks"
    else
      unless parts.length is 3
        return @fail "uniliterals for { cardinals_only: false } that are not a single character must have exactly 2 blanks, got #{parts.length - 1} blanks"
    #.......................................................................................................
    if parts.length is 2
      [ _nuns,
        _cipher,
        _puns,  ] = [ null, parts..., ]
    else
      [ _nuns,
        _cipher,
        _puns,  ] = parts
      _nuns       = null if cardinals_only
    #.......................................................................................................
    _zpuns = _cipher + _puns
    @assign { _nuns, _zpuns, _cipher, }
    #.......................................................................................................
    if cardinals_only
      @assign { _nuns_list: null, }
    else
      return false unless @T.incremental_text.dm_isa @data, { chrs: '_nuns_list', },  _nuns
    #.......................................................................................................
    return false unless @T.incremental_text.dm_isa @data, { chrs: '_zpuns_list', }, _zpuns
    return true

  #---------------------------------------------------------------------------------------------------------
  @_alphabet: ( x ) ->
    return false unless @T.nonempty_text.dm_isa    @data, null, x
    return false unless @T.incremental_text.dm_isa @data, null, x
    return true

  #---------------------------------------------------------------------------------------------------------
  @_max_integer: ( x, _base ) ->
    return @fail "x not a positive safe integer"            unless @T.pinteger.isa        x
    return @fail "_base not a safe integer greater than 1"  unless @T._base.isa            _base
    return @fail "x not a positive all-niners"              unless is_positive_all_niner  x, _base
    return true

  #---------------------------------------------------------------------------------------------------------
  @idx_or_vdx: ( x ) ->
    switch true
      when @T.integer.isa x
        @assign { type: 'idx' }
        return true
      when @T.list.isa x
        @assign { type: 'vdx' }
        return true
    return @fail "not a list or an integer"

  #---------------------------------------------------------------------------------------------------------
  @idx: ( x, _min_integer = null, _max_integer = null ) ->
    return @fail "#{rpr x} not a safe integer"                    unless @T.integer.isa x
    return @fail "#{rpr x} not greater or equal #{_min_integer}"  if _min_integer? and not ( x >= _min_integer )
    return @fail "#{rpr x} not less or equal #{_min_integer}"     if _max_integer? and not ( x <= _max_integer )
    return true

  #---------------------------------------------------------------------------------------------------------
  @vdx: ( x ) -> ( @T.list.isa x ) # and ( x.length > 0 )

  #---------------------------------------------------------------------------------------------------------
  ### TAINT should be method of `T._max_integer` ###
  create_max_integer: ({ _base, digits_per_idx, }) ->
    @_base.validate           _base
    @digits_per_idx.validate  digits_per_idx
    R = Math.min ( get_max_integer Number.MAX_SAFE_INTEGER, _base ), ( ( _base ** digits_per_idx ) - 1 )
    @_max_integer.validate R, _base
    return R

  #---------------------------------------------------------------------------------------------------------
  @digits_per_idx: ( x, _pmag_list = null ) ->
    return @fail "#{x} not a positive safe integer"                           unless @T.pinteger.isa x
    return @fail "#{x} exceeds limit #{_pmag_list.length} set by magnifiers"  if _pmag_list? and not ( x <= _pmag_list.length )
    return true

#===========================================================================================================
_test_monotony = ( x, cmp ) ->
  { chrs, } = @data # = @create data
  return ( @fail "empty is not monotonic" ) if chrs.length is 0
  return true                               if chrs.length is 1
  for idx in [ 1 ... chrs.length ]
    prv_chr = chrs[ idx - 1 ]
    chr     = chrs[ idx     ]
    R       = switch cmp
      when '>' then prv_chr > chr
      when '<' then prv_chr < chr
      else throw new Error "Ωbsk__10 (internal) expected '>' or '<', got #{rpr cmp}"
    continue if R
    @assign { fail: { x, idx, prv_chr, chr, }, }
    return false
  return true

#===========================================================================================================
Object.assign module.exports, {
  Hollerith_typespace,
  CFG:                  CFG,
  internals, }
