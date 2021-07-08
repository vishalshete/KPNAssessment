/**
 * Created by vishalshete on 07/07/2021.
 */

@IsTest
public with sharing class OrderProductsControllerTest {

    @TestSetup
    private static void createTestData(){
        System.runAs(TestDataFactory.getAdminUser()){
            TestDataFactory.createTestData();
        }
    }
    @IsTest
    private static void getAvailableOrderItemsSuccess(){
        //given
        Order order = [SELECT Id FROM Order LIMIT 1];
        Test.startTest();
            List<OrderItem> orderItems = OrderProductsController.getAvailableOrderItems(order.Id);
        Test.stopTest();
        //expected
        System.assertEquals(1,orderItems.size(),'OrderItem size should be 1');
    }
    @IsTest
    private static void testGetOrder(){
        //given
        Order order = [SELECT Id FROM Order LIMIT 1];

        Test.startTest();
            Order fetchedOrder = OrderProductsController.getOrder(order.Id);
        Test.stopTest();
        //expected
        System.assertEquals('Draft',fetchedOrder.Status,'Status of Order should be draft');
    }
    @IsTest
    private static void addExistingOrderItem(){
        //given
        Product2 product = [SELECT Id FROM Product2 WHERE Name = 'Test Product1'];
        PricebookEntry pricebookEntry = [SELECT Id FROM PricebookEntry WHERE Product2Id= :product.Id];
        Order order = [SELECT Id FROM Order LIMIT 1];

        //when Product already added to Order
        Test.startTest();
        List<OrderItem> orderItems = OrderProductsController.addOrderItem(order.Id,product.Id,pricebookEntry.Id);
        Test.stopTest();
        //expected Quantity of the orderItem will be increased
        System.assertEquals(1,orderItems.size(),'OrderItem size should be 1');
        System.assertEquals(2,orderItems.get(0).Quantity,'OrderItem Quantity should be 2');

    }
    @IsTest
    private static void addNewOrderItem(){
        //given
        Product2 product = [SELECT Id FROM Product2 WHERE Name = 'Test Product2'];
        PricebookEntry pricebookEntry = [SELECT Id FROM PricebookEntry WHERE Product2Id= :product.Id];
        Order order = [SELECT Id FROM Order LIMIT 1];

        //when Product is not present in listed OrderItems
        Test.startTest();
        List<OrderItem> orderItems = OrderProductsController.addOrderItem(order.Id,product.Id,pricebookEntry.Id);
        Test.stopTest();

        //expected new order Item will be inserted
        System.assertEquals(2,orderItems.size(),'OrderItem size should be 2');

    }

    @IsTest
    private static void testActivateOrderItemsSuccess(){
        //given
        Order order = [SELECT Id FROM Order LIMIT 1];
        Test.startTest();
        PostOrderHttpMock.successResponse = true;
        Test.setMock(HttpCalloutMock.class, new PostOrderHttpMock());

        Order order2 = OrderProductsController.activateOrderItems(order.Id);
        Test.stopTest();
        //expected Order will be Activated
        System.assertEquals('Activated',order2.Status,'Order should be Activated');

    }

    @IsTest
    private static void testActivateOrderItemsError(){
        //given
        Order order = [SELECT Id FROM Order LIMIT 1];
        try {
            Test.startTest();
            PostOrderHttpMock.successResponse = false;
            Test.setMock(HttpCalloutMock.class, new PostOrderHttpMock());
            Test.stopTest();
        } catch(CustomException ex){
            Order order2 = OrderProductsController.activateOrderItems(order.Id);
            System.assertEquals(Label.Order_Integration_Error,ex.getMessage(),'Exception message should match');
            System.assertNotEquals('Activated',order2.Status,'Order should not Activated');

        }

    }
}