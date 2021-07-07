/**
 * Created by vishalshete on 07/07/2021.
 */

@IsTest
public with sharing class AvailableProductsControllerTest {

    @TestSetup
    private static void createTestData(){
        System.runAs(TestDataFactory.getAdminUser()){
            TestDataFactory.createTestData();
        }
    }
    @IsTest
    private static void getAvailableOrderItemsSuccess(){
        Test.startTest();
        List<PricebookEntry> pricebookEntries = AvailableProductsController.getAvailableProducts(Test.getStandardPricebookId());
        Test.stopTest();
        System.assertEquals(2,pricebookEntries.size(),'There should be 2 PricebookEntries');
    }
    @IsTest
    private static void testGetPricebooks(){
        Test.startTest();
        List<Pricebook2> pricebooks = AvailableProductsController.getPricebooks();
        Test.stopTest();
        System.assertEquals(0,pricebooks.size(),'There should be 0 Pricebook while running test');
    }
}