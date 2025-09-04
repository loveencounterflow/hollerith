
'use strict'

#===========================================================================================================
SFMODULES                 = require 'bricabrac-single-file-modules'
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ debug,                } = console
{ regex,                } = require 'regex'
{ hide,
  set_getter,           } = SFMODULES.require_managed_property_tools()
{ nameit,               } = SFMODULES.require_nameit()
{ clean_assign,         } = SFMODULES.unstable.require_clean_assign()
{ remap,
  omit,                 } = SFMODULES.unstable.require_remap()
{ freeze,               } = Object


#===========================================================================================================
### NOTE Future Single-File Module ###
class Type

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace, name, isa ) ->
    hide @, 'name',   name
    hide @, 'T',      typespace
    hide @, '_isa',   isa
    @data           = {} # new Bounded_list()
    return undefined

  #---------------------------------------------------------------------------------------------------------
  isa: ( x, data = null, mapping = null ) ->
    @data   = {}
    R       = @_isa.call @, x
    #.......................................................................................................
    if data?
      if mapping?     then  clean_assign data, ( remap ( clean_assign {}, @data ), mapping )  ### d1 m1 ###
      else                  clean_assign data,                            @data               ### d1 m0 ###
    else if mapping?  then                       remap                    @data,   mapping    ### d0 m1 ###
    return R                                                                                  ### d0 m0 ###

  #---------------------------------------------------------------------------------------------------------
  assign: ( P... ) -> clean_assign @data, P...

  #---------------------------------------------------------------------------------------------------------
  fail: ( message, P... ) -> clean_assign @data, { message, }, P...; false


#===========================================================================================================
class Typespace

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    clasz = @constructor
    for name in Object.getOwnPropertyNames clasz
      class Typeclass extends Type
      nameit name, Typeclass
      @[ name ] = new Typeclass @, name, isa = clasz[ name ]
    return undefined


############################################################################################################
# HOLLERITH TYPESPACE
#===========================================================================================================
class Hollerith_typespace extends Typespace

  #=========================================================================================================
  @text:           ( x ) -> ( type_of x ) is 'text'
  @nonempty_text:  ( x ) -> ( @T.text.isa x ) and x.length > 0
  @float:          ( x ) -> Number.isFinite x
  @integer:        ( x ) -> Number.isSafeInteger x
  @pinteger:       ( x ) -> ( @T.integer.isa x ) and x > 0
  @zpinteger:      ( x ) -> ( @T.integer.isa x ) and x >= 0
  @cardinal:       ( x ) -> @T.zpinteger.isa x
  #---------------------------------------------------------------------------------------------------------
  @dimension:      ( x ) -> @T.pinteger.isa  x

  #---------------------------------------------------------------------------------------------------------
  @incremental_text: ( x ) ->
    return false unless @T.text.isa x
    # @assign { iam: 'incremental_text', }
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
    [ nmag_bare_reversed,
      pmag_bare,  ] = x.split /\s+/v
    #.......................................................................................................
    # @assign { iam: 'magnifiers', }; debug 'Ωbsk___1', @data
    return ( @fail "Ωbsk___2 ???" ) unless  @T.nmag_bare_reversed.isa nmag_bare_reversed, @data, { chrs: 'nmag_chrs', }
    return ( @fail "Ωbsk___3 ???" ) unless  @T.pmag_bare.isa          pmag_bare,          @data, { chrs: 'pmag_chrs', }
    return ( @fail "Ωbsk___4 ???" ) unless  @T.incremental_text.isa   nmag_bare_reversed + pmag_bare
    #.......................................................................................................
    nmag            = ' ' + @data.nmag_chrs.reverse().join ''
    pmag            = ' ' + pmag_bare
    @assign { nmag, pmag, }
    return true


#===========================================================================================================
_test_monotony = ( x, cmp ) ->
  { chrs, } = @data # = @create data
  return ( @fail "empty is not monotonic" ) if chrs.length is 0
  return true   if chrs.length is 1
  for idx in [ 1 ... chrs.length ]
    prv_chr = chrs[ idx - 1 ]
    chr     = chrs[ idx     ]
    R       = switch cmp
      when '>' then prv_chr > chr
      when '<' then prv_chr < chr
      else throw new Error "Ωbsk___5 (internal) expected '>' or '<', got #{rpr cmp}"
    continue if R
    @assign { fail: { x, idx, prv_chr, chr, }, }
    return false
  return true

#===========================================================================================================
Object.assign module.exports,
  types:      new Hollerith_typespace()
  internals: {
    Type
    Typespace
    Hollerith_typespace
    # Bounded_list
    }
