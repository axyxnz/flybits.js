/**
 * Interface for models which have localized properties.
 * @memberof Flybits.interface
 * @interface
 */
Flybits.interface.Localizable = {
  /**
   * Parses server localized properties for a single locale object. For instance if a model has localized properties {'en':{},'fr':{}}, each object mapped to each locale key would pass through this function.
   * @function
   * @instance
   * @memberof Flybits.interface.Localizable
   * @param {Object} serverObj server locale object containing localized properties.
   * @return {Object} Server localized properties of a locale key parsed to SDK equivalent objects.
   */
  _fromLocaleJSON: function(serverObj){},
  /**
   * Maps SDK localized objects back to server equivalent objects.
   * @function
   * @instance
   * @memberof Flybits.interface.Localizable
   * @param {Object} appObj application locale object containing localized properties
   * @return {Object} SDK localized properties of a locale key parsed to server equivalent objects.
   */
  _toLocaleJSON: function(appObj){}
};
