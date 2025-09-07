
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



############################################################################################################
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
  @nmag_bare_reversed:  ( x ) -> @T.incremental_text.isa x, @data
  @pmag_bare:           ( x ) -> @T.incremental_text.isa x, @data

  #---------------------------------------------------------------------------------------------------------
  @magnifiers: ( x ) ->
    return ( @fail "expected a magnifier, got an empty text" ) unless @T.nonempty_text.isa x
    parts                   = x.split @[CFG].blank_splitter
    unless parts.length is 2
      return ( @fail "Ωbsk___1 magnifiers must have exactly 1 blank, got #{parts.length - 1} blanks")
    [ nmag_bare_reversed,
      pmag_bare,          ] = parts
    #.......................................................................................................
    # @assign { iam: 'magnifiers', }; debug 'Ωbsk___2', @data
    return ( @fail "Ωbsk___3 ???" ) unless  @T.nmag_bare_reversed.isa nmag_bare_reversed, @data, { chrs: 'nmag_chrs_reversed', }
    return ( @fail "Ωbsk___4 ???" ) unless  @T.pmag_bare.isa          pmag_bare,          @data, { chrs: 'pmag_chrs', }
    return ( @fail "Ωbsk___5 ???" ) unless  @T.incremental_text.isa   nmag_bare_reversed + pmag_bare
    return ( @fail "Ωbsk___6 ???" ) unless  nmag_bare_reversed.length is pmag_bare.length
    #.......................................................................................................
    nmag      = @[CFG].blank + [ @data.nmag_chrs_reversed..., ].reverse().join ''
    pmag      = @[CFG].blank + pmag_bare
    nmag_chrs = freeze Array.from nmag
    pmag_chrs = freeze Array.from pmag
    @assign { nmag, pmag, nmag_chrs, pmag_chrs, }
    return true

  #---------------------------------------------------------------------------------------------------------
  @alphabet: ( x ) ->
    return false unless @T.incremental_text.isa x, @data, { chrs: 'alphabet_chrs', }
    base              = @data.alphabet_chrs.length
    return @fail "an alphabet must have 2 chrs or more" unless @T.base.isa base
    niner             = @data.alphabet_chrs.at -1
    leading_niner_re  = ( regex 'g' )""" ^ #{niner}*? (?= . $ ) """
    @assign { base, niner, leading_niner_re, }
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
      return ( @fail "Ωbsk___7 uniliterals that are not a single character must have exactly 2 blank2, got #{parts.length - 1} blanks")
    [ nuns,
      zero,
      puns, ] = parts
    zpuns     = zero + puns
    @assign { nuns, zpuns, }
    return false unless @T.incremental_text.isa nuns,  @data, { chrs: 'nun_chrs', }
    return false unless @T.incremental_text.isa zpuns, @data, { chrs: 'zpun_chrs', }
    return true

  #---------------------------------------------------------------------------------------------------------
  @TMP_alphabet: ( x ) ->
    return false unless @T.nonempty_text.isa    x, @data
    return false unless @T.incremental_text.isa x, @data
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
      else throw new Error "Ωbsk___8 (internal) expected '>' or '<', got #{rpr cmp}"
    continue if R
    @assign { fail: { x, idx, prv_chr, chr, }, }
    return false
  return true

#===========================================================================================================
Object.assign module.exports, {
  Hollerith_typespace,
  CFG:                  CFG,
  internals:            { Type, Typespace, }, }
