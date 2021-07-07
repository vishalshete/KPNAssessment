/**
 * Created by vishalshete on 07/07/2021.
 */

@IsTest
public with sharing class TestDataFactory {

    @TestVisible
    private static Map<String, Profile> profilesByName {
        get{
            if(profilesByName==null){
                profilesByName = new Map<String, Profile>();
                Profile[] profiles = [SELECT Name, Id FROM Profile];
                for (Profile profile : profiles) {
                    profilesByName.put(profile.Name, profile);
                }
            }
            return profilesByName;
        }
    }

    public static User getAdminUser(){
        return getNewUser('System Administrator');
    }

    private static User getNewUser(String profileName){
        User u = new User(Alias = 'standt', Email='standarduser@testorg.com',
                EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US',
                LocaleSidKey='en_US', ProfileId = profilesByName.get(profileName).Id,
                TimeZoneSidKey='America/Los_Angeles', UserName='TestAdminUser' + Math.random().intValue() + '@asssessment.nl');
        insert u;
        return u;
    }
    @TestVisible
    private static void createTestData(){
        Account account = new Account(Name = 'Test data Account');
        insert account;
        Order order = new Order(EffectiveDate = System.today(),AccountId = account.Id,Status = 'Draft',Pricebook2Id=Test.getStandardPricebookId());
        insert order;

        Product2 product1 = new Product2(Name = 'Test Product1',IsActive = true);
        Product2 product2 = new Product2(Name = 'Test Product2',IsActive = true);
        List<Product2> products = new List<Product2>();
        products.add(product1);
        products.add(product2);
        insert products;

        PricebookEntry pricebookEntry= new PricebookEntry( Product2Id = product1.Id,Pricebook2Id = Test.getStandardPricebookId(),UnitPrice = 10.00,IsActive = true);
        PricebookEntry pricebookEntry2= new PricebookEntry( Product2Id = product2.Id,Pricebook2Id = Test.getStandardPricebookId(),UnitPrice = 15.00,IsActive = true);
        List<PricebookEntry> pricebookEntries = new List<PricebookEntry>();

        pricebookEntries.add(pricebookEntry);
        pricebookEntries.add(pricebookEntry2);
        insert pricebookEntries;

        OrderItem orderItem = new OrderItem( OrderId = order.Id,Product2Id = product1.Id,PricebookEntryId=pricebookEntry.Id,Quantity=1,UnitPrice = pricebookEntry.UnitPrice);
        insert orderItem;
    }
}