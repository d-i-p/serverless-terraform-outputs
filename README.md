# serverless-terraform-outputs

This is a fork of https://github.com/rundeck/serverless-terraform-outputs adapted to our needs.

In particular, these are the differences:

* Terraform outputs are referenced with just `${terraform:outputname}` instead of `${terraform:workspacename:outputname:value}`.
* The `terraform output` output is only ran once and the results are reused everywhere. This speeds up running any serverless command, especially if there are many terraform variables being referenced.
* The `cwd` where to run terraform is hardcoded to `infrastructure`.
* Only the `TF_WORKSPACE` environment variable is passed to the terraform command when running on our CI server (identified by `CI=1`). Otherwise, when using AWS credentials of an assumed role to provision another AWS account, it would also use those for terraform, which we explicitly do not want. In our case, terraform must always be ran with the standard credentials of the assumed role from the instance profile so it can access the state file bucket from our management account. The providers in terraform are then configured accordingly to assume a role themselves so the right AWS account is then provisioned.