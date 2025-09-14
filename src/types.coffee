
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
  get_niners_re: ( _nova ) -> ( regex 'g' )""" ^ #{_nova}* (?= .+ $ ) """



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
  # @blank_setting:   ( x ) -> ( @T.character.isa x )
  # @blank_usage:     ( x ) -> ( x is @[CFG].blank )
  @dimension:       ( x ) -> ( @T.pinteger.isa x )
  @base:            ( x ) -> ( @T.pinteger.isa x ) and ( x > 1 )
  @digit_count:     ( x ) -> ( @T.pinteger.isa x ) and ( x > 1 )

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
  @magnifiers: ( x ) ->
    return ( @fail "expected a magnifier, got an empty text" ) unless @T.nonempty_text.isa x
    parts                   = x.split @[CFG].blank_splitter
    unless parts.length is 2
      return ( @fail "magnifiers must have exactly 1 blank, got #{parts.length - 1} blanks")
    [ nmag_bare_reversed,
      pmag_bare,          ] = parts
    #.......................................................................................................
    # @assign { iam: 'magnifiers', }; debug 'Ωbsk___1', @data
    return ( @fail "Ωbsk___2 ???" ) unless  @T.nmag_bare_reversed.dm_isa @data, { chrs: 'nmag_chrs_reversed', },  nmag_bare_reversed
    return ( @fail "Ωbsk___3 ???" ) unless  @T.pmag_bare.dm_isa          @data, { chrs: 'pmag_chrs', },           pmag_bare
    return ( @fail "Ωbsk___4 ???" ) unless  @T.incremental_text.isa                                               nmag_bare_reversed + pmag_bare
    return ( @fail "Ωbsk___5 ???" ) unless  nmag_bare_reversed.length is pmag_bare.length
    #.......................................................................................................
    nmag      = @[CFG].blank + [ @data.nmag_chrs_reversed..., ].reverse().join ''
    pmag      = @[CFG].blank + pmag_bare
    nmag_chrs = freeze Array.from nmag
    pmag_chrs = freeze Array.from pmag
    @assign { nmag, pmag, nmag_chrs, pmag_chrs, }
    return true

  #---------------------------------------------------------------------------------------------------------
  @alphabet: ( x ) ->
    return false unless @T.incremental_text.dm_isa @data, { chrs: 'alphabet_chrs', }, x
    base              = @data.alphabet_chrs.length
    return @fail "an alphabet must have 2 chrs or more" unless @T.base.isa base
    _naught           = @data.alphabet_chrs.at  0
    _nova             = @data.alphabet_chrs.at -1
    leading_niners_re = internals.get_niners_re _nova
    @assign { base, _naught, _nova, leading_niners_re, }
    return true

  #---------------------------------------------------------------------------------------------------------
  @uniliterals: ( x ) ->
    return false unless @T.nonempty_text.isa x
    if @T.character.isa x
      nuns      = ''
      zpuns     = x
      nun_chrs  = freeze []
      zpun_chrs = freeze [ x, ]
      @assign { nuns, zpuns, nun_chrs, zpun_chrs, }
      return true
    parts = x.split @[CFG].blank_splitter
    unless parts.length is 3
      return ( @fail "uniliterals that are not a single character must have exactly 2 blank2, got #{parts.length - 1} blanks")
    [ nuns,
      _cipher,
      puns, ] = parts
    zpuns     = _cipher + puns
    @assign { nuns, zpuns, _cipher, }
    return false unless @T.incremental_text.dm_isa @data, { chrs: 'nun_chrs', },  nuns
    return false unless @T.incremental_text.dm_isa @data, { chrs: 'zpun_chrs', }, zpuns
    return true

  #---------------------------------------------------------------------------------------------------------
  @TMP_alphabet: ( x ) ->
    return false unless @T.nonempty_text.dm_isa    @data, null, x
    return false unless @T.incremental_text.dm_isa @data, null, x
    return true

  #---------------------------------------------------------------------------------------------------------
  @_max_integer_$: ( x, base ) ->
    return @fail "x not a positive safe integer"           unless @T.pinteger.isa        x
    return @fail "base not a safe integer greater than 1"  unless @T.base.isa            base
    return @fail "x not a positive all-niners"             unless is_positive_all_niner  x, base
    return true

  #---------------------------------------------------------------------------------------------------------
  ### TAINT should be method of `T._max_integer_$` ###
  create_max_integer_$: ({ base, digit_count, }) ->
    @base.validate        base
    @digit_count.validate digit_count
    R = Math.min ( get_max_integer Number.MAX_SAFE_INTEGER, base ), ( ( base ** digit_count ) - 1 )
    @_max_integer_$.validate R, base
    return R

  #---------------------------------------------------------------------------------------------------------
  @_max_digits_per_idx_$: ( x, pmag_chrs ) ->
    return @fail "x not a positive safe integer"           unless @T.pinteger.isa x
    return @fail "x #{x} exceeds limit set by magnifiers"  unless x <= pmag_chrs.length
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
      else throw new Error "Ωbsk___6 (internal) expected '>' or '<', got #{rpr cmp}"
    continue if R
    @assign { fail: { x, idx, prv_chr, chr, }, }
    return false
  return true

#===========================================================================================================
Object.assign module.exports, {
  Hollerith_typespace,
  CFG:                  CFG,
  internals, }
