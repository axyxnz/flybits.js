/**
 * Interface for implementing context plugins.
 * @memberof Flybits.interface
 * @interface
 */
Flybits.interface.ContextPlugin = {
  /**
   * Checks for availability of this plugin on the current platform.
   * @function
   * @memberof Flybits.interface.ContextPlugin
   * @return {external:Promise<undefined,Flybits.Validation>} Promise that resolves without value if this context plugin is supported on the current platform.
   */
  isSupported: function(){},
  /**
   * Retrieves current value of this particular context plugin.
   * @function
   * @memberof Flybits.interface.ContextPlugin
   * @return {external:Promise<Object,Flybits.Validation>} Promise that resolves with context plugin specific data structure representing current value of context plugin.
   */
  getState: function(){},

  /**
   * Converts context value object into the server expected format.
   * @function
   * @memberof Flybits.interface.ContextPlugin
   * @param {Object} contextValue
   * @return {Object} Expected server format of context value.
   */
  _toServerFormat: function(contextValue){}
};
