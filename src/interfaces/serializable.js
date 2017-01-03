/**
 * Interface for SDK models that are abstracted from server models.
 * @memberof Flybits.interface
 * @interface
 */
Flybits.interface.Serializable = {
  /**
   * Parses raw server models into SDK model properties that implement this interface.
   * @function
   * @instance
   * @memberof Flybits.interface.Serializable
   * @param {Object} serverObj Raw server model.
   */
  fromJSON: function(serverObj){},
  /**
   * Maps SDK model properties to abstracted server models.
   * @function
   * @instance
   * @memberof Flybits.interface.Serializable
   * @returns {Object} Raw server model.
   */
  toJSON: function(){}
};
