/**
 * Interface for models that can be tagged in the Flybits ecosystem.
 * @see Flybits.Tag
 * @memberof Flybits.interface
 * @interface
 */
Flybits.interface.Taggable = {
  /**
   * Convenience function to check if model is associated with a particular {@link Flybits.Tag}
   * @function
   * @instance
   * @memberof Flybits.interface.Taggable
   * @param {string} tagID ID of the {@link Flybits.Tag} model.
   * @returns {boolean} `true` if model is associated with specified `tagID`, `false` if otherwise.
   */
  hasTag: function(tagID){},
  /**
   * Function to retrieve actual {@link Flybits.Tag} models associated with model.
   * @function
   * @instance
   * @memberof Flybits.interface.Taggable
   * @returns {Flybits.Tag[]} Array of {@link Flybits.Tag} models that are associated with model.
   */
  getTags: function(){}
};
