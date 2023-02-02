sap.ui.define([], function () {
	"use strict";
	return {
		/**
		 * Create Dialog to Upload Excel and open it
		 * @param {*} oEvent
		 */
		openExcelUploadDialog: async function (oEvent) {
			this._view.setBusyIndicatorDelay(0);
			this._view.setBusy(true);
			if (!this.excelUpload) {
				this.excelUpload = await sap.ui.getCore().createComponent({
					name: "cc.excelUpload",
					async: false,
					componentData: {
						context: this
					}
				});
			}
			this.excelUpload.openExcelUploadDialog();
			this._view.setBusy(false);
		}
	};
});