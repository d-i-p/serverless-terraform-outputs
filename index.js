const util = require('util')
const childProcess = require('child_process')

const exec = util.promisify(childProcess.exec)

const TF_PREFIX = 'terraform:'

module.exports = class ServerlessTerraformOpts {
    constructor(serverless) {
        this.serverless = serverless
        const delegate = serverless.variables.getValueFromSource.bind(
            serverless.variables
        )

        serverless.variables.getValueFromSource = variableString => {
            if (variableString.startsWith(TF_PREFIX)) {
                const name = variableString.split(TF_PREFIX)[1]
                return this.getValueFromTerraformOutput(name)
            } else {
                return delegate(variableString)
            }
        }
    }

    async getValueFromTerraformOutput(name) {
        const outputs = await this.cachedTerraformOutput()
        const keyValues = {}
        for (let [k, v] of Object.entries(outputs)) {
            keyValues[k] = v.value
        }
        
        const value = keyValues[name]
        if (value == null) {
            throw new this.serverless.classes.Error(`terraform-serverless-outputs: Output <${name}> not found`)
        }

        return value
    }

    async cachedTerraformOutput() {
        if (this.cachedOutputsPromise) {
            return await this.cachedOutputsPromise
        } else {
            this.cachedOutputsPromise = terraformOutput()
            return await this.cachedOutputsPromise
        }
    }
}

async function terraformOutput() {
    const options = {
        cwd: 'infrastructure',
        env: terraformOutputsEnvironmentVars(),
    }

    const res = await exec('terraform output -json', options)
    const parsed = JSON.parse(res.stdout)

    printTerraformOutputs(parsed)
    return parsed
}

function terraformOutputsEnvironmentVars() {
    if (!process.env.CI) {
        return process.env
    }

    const ciEnvVars = {}
    if (process.env.TF_WORKSPACE) {
        ciEnvVars.TF_WORKSPACE = process.env.TF_WORKSPACE
    }

    return ciEnvVars
}

function printTerraformOutputs(outputs) {
    let text = 'Serverless terraform outputs:\n'
    for (let [k, v] of Object.entries(outputs)) {
        text += `${k} = ${v.value}\n`
    }
    console.log(text)
}
