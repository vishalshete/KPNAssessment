/**
 * Created by vishalshete on 06/07/2021.
 */

public with sharing class AvailableProductsController {

    /**
     * @description Method to get list of active PricebookEntries based on specific Pricebook
     * @param pricebookId Id of the Pricebook
     *
     * @return List of Pricebook Entries
     */
    @AuraEnabled(Cacheable=true)
    public static List<PricebookEntry> getAvailableProducts(Id pricebookId){
        return [SELECT Name,Id,UnitPrice,Product2Id FROM PricebookEntry WHERE IsActive = TRUE AND Pricebook2Id =:pricebookId WITH SECURITY_ENFORCED ];
    }

    /**
     * @description Method to get list of all active Pricebook
     * @return List of Pricebook
     */
    @AuraEnabled(Cacheable=true)
    public static List<Pricebook2> getPricebooks(){
        return[SELECT Id,Name FROM Pricebook2 WHERE IsActive = TRUE WITH SECURITY_ENFORCED];
    }
}