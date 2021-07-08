# Pre-requisite
1) The list of the objects required are Order, Order Item, Product, Pricebook, PricebookEntry.
2) Org should have Active Products.
3) Org should have at least one PriceBook.
4) Org should have Pricebook Entries for the Products.
5) If there are additional require fields to create an Order Item, then apex needs to be updated to match those fields.
6) The list of the objects required are Order, Order Item, Product, Pricebook, PricebookEntry.

# Solution
1) We have two components on the Order detail page "Available Products" and "Order Products".
2) The components use Order Record Id to load data and format them accordingly.
3) These components communicate with MessageChannel, the messages use source and recordId to filter and execute the functionality accordingly.
4) Both components use apex controllers to query and perform DML operations.
5) The components can be placed anywhere in Order detail page. 
6) User can select Pricebook on available 




# Salesforce DX Project: Next Steps

Now that you’ve created a Salesforce DX project, what’s next? Here are some documentation resources to get you started.

## How Do You Plan to Deploy Your Changes?

Do you want to deploy a set of changes, or create a self-contained application? Choose a [development model](https://developer.salesforce.com/tools/vscode/en/user-guide/development-models).

## Configure Your Salesforce DX Project

The `sfdx-project.json` file contains useful configuration information for your project. See [Salesforce DX Project Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm) in the _Salesforce DX Developer Guide_ for details about this file.

## Read All About It

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
