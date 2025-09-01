
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


#===========================================================================================================
### NOTE Future Single-File Module ###
class Bounded_list

  #---------------------------------------------------------------------------------------------------------
  constructor: ( max_size = 3 ) ->
    @max_size   = max_size
    @data       = []
    return undefined

  #---------------------------------------------------------------------------------------------------------
  create: ( P... ) ->
    @data.push { P..., }
    @data.shift() if @size > @max_size
    return @current

  #---------------------------------------------------------------------------------------------------------
  at: ( idx ) -> @data.at idx

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'size',     -> @data.length
  set_getter @::, 'is_empty', -> @data.length is 0

  #---------------------------------------------------------------------------------------------------------
  set_getter @::, 'current', ->
    @create() if @is_empty
    return @at -1


#===========================================================================================================
### NOTE Future Single-File Module ###
class Type

  #---------------------------------------------------------------------------------------------------------
  constructor: ( typespace, name, isa ) ->
    hide @, 'name',   name
    hide @, 'T',      typespace
    hide @, '_isa',   isa
    @data           = {}
    hide @, '_ctx',   { T: typespace, me: @, data: @data, }
    return undefined

  #---------------------------------------------------------------------------------------------------------
  isa: ( x ) ->
    delete @data[ key ] for key of @data
    return @_isa.call @_ctx, x


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
    ### TAINT code duplication ###
    return false unless @T.nonempty_text.isa x
    @data.chrs = chrs = Array.from x
    return true if chrs.length is 1
    for idx in [ 1 ... chrs.length ]
      unless ( prv_chr = chrs[ idx - 1 ] ) < ( chr = chrs[ idx ] )
        @data.fail = { x, idx, prv_chr, chr, }
        return false
    return true

  #---------------------------------------------------------------------------------------------------------
  @decremental_text: ( x ) ->
    ### TAINT code duplication ###
    return false unless @T.nonempty_text.isa x
    @data.chrs = chrs = Array.from x
    return true if chrs.length is 1
    for idx in [ 1 ... chrs.length ]
      unless ( prv_chr = chrs[ idx - 1 ] ) > ( chr = chrs[ idx ] )
        @data.fail = { x, idx, prv_chr, chr, }
        return false
    return true

  #---------------------------------------------------------------------------------------------------------
  @nmag_bare_reversed: ( x ) ->
    return false unless @T.nonempty_text x

  #---------------------------------------------------------------------------------------------------------
  @pmag_bare: ( x ) ->

  #---------------------------------------------------------------------------------------------------------
  @magnifiers: ( x ) ->
    return false unless @T.nonempty_text.isa x
    [ nmag_bare_reversed,
      pmag_bare,  ] = x.split /\s+/v
    return false unless @T.nmag_bare_reversed.isa nmag_bare_reversed
    return false unless @T.pmag_bare.isa          pmag_bare
    nmag            = ' ' + nmag_bare_reversed.reverse()
    pmag            = ' ' + pmag_bare


#===========================================================================================================
module.exports = { types: new Typespace(), internals: { Type, Typespace, Bounded_list, }, }
