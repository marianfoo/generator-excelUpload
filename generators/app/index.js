const Generator = require("yeoman-generator"),
    fileaccess = require("../../helpers/fileaccess"),
    util = require("../utils")
    path = require("path")
    glob = require("glob");

module.exports = class extends Generator {
    static displayName = "Enable the UI5 Excel Upload Custom Control";

    async prompting() {
        const data = this.config.getAll();
        const manifesJson = fileaccess.getJSON("/webapp/manifest.json")
        
        

        const questionTemplate = await this.prompt(
            {
                type: 'list',
                name: 'templateType',
                message: 'On which page would you like to add Excel Upload?',
                choices: [
                    { name: 'Object Page', value: 'sap.fe.templates.ObjectPage' },
                    { name: 'List Report', value: 'sap.fe.templates.ListReport' }
                  ]
              }
        );
        const entitySets = util.getUniqueEntitySetValues(manifesJson,questionTemplate.templateType)
        const questionEntitySet = await this.prompt([
            {
                type: 'list',
                name: 'entitySet',
                message: 'Which entity Set?',
                choices: entitySets
              }
        ]);
        const manifestTargets = util.findEntitySetValue(manifesJson, questionEntitySet.entitySet,questionTemplate.templateType)

        var aPrompt = [
            {
                type: "input",
                name: "buttonText",
                message: "Button Text?",
                default: "Excel Upload"
            }
        ];

        return this.prompt(aPrompt).then((answers) => {
            this.options.oneTimeConfig = this.config.getAll();
            this.options.oneTimeConfig.buttonText = answers.buttonText;
            this.options.oneTimeConfig.target = manifestTargets.id;
        });
    }

    async writing() {
        const oConfig = this.config.getAll();
        const buttonText = this.options.oneTimeConfig.buttonText;
        const target= this.options.oneTimeConfig.target;
        const sComponentName = this.options.oneTimeConfig.componentName;
        const sComponentData = this.options.oneTimeConfig.componentData || {};
        const sLazy = this.options.oneTimeConfig.lazy;
        const sModuleName = this.options.oneTimeConfig.modulename;

        this.sourceRoot(path.join(__dirname, "templates"));
        glob.sync("**", {
            cwd: this.sourceRoot(),
            nodir: true
        }).forEach((file) => {
            const sOrigin = this.templatePath(file);
            const sTarget = this.destinationPath(file.replace(/^_/, "").replace(/\/_/, "/"));

            this.fs.copyTpl(sOrigin, sTarget, oConfig);
        });

        await fileaccess.manipulateJSON.call(this, "/package.json", {
            "dependencies": {
                "ui5-cc-excelupload": "0.6.0"
              }});

        await fileaccess.manipulateJSON.call(this, "/package.json", {
            "ui5": {
                "dependencies": [
                  "ui5-cc-excelupload"
                ]
              }
        });

        await fileaccess.manipulateJSON.call(this, "/webapp/manifest.json", {
            "sap.ui5": {
                    resourceRoots: {
                        "cc.excelUpload":"./thirdparty/customControl/excelUpload/v0/6/0"
                        }
                    }
        });

        await fileaccess.manipulateJSON.call(this, "/webapp/manifest.json", {
                "sap.ui5": {
                    "routing": {
                        "targets": {
                            [target]: {
                                "options": {
                                    "settings": {
                                        "content": {
                                            "header": {
                                                "actions": {
                                                    "excelUpload": {
                                                        "id" : "excelUploadButton",
                                                        "text" : buttonText,
                                                        "enabled": "{ui>/isEditable}",
                                                        "press" : "ui5.cc.v4.samplev4excelupload.ext.ObjectPageExtController.openExcelUploadDialog",
                                                        "requiresSelection": false
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
        });
    }

    end() {
        this.spawnCommandSync('npm', ['install'], {
            cwd: this.destinationPath()
        });
    }
};
