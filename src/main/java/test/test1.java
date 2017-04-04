package test;

import java.io.IOException;
import java.util.concurrent.TimeUnit;







import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.openqa.selenium.support.PageFactory;

import com.izt.snow.automation.functionLibrary.ElementExtraction;
import com.izt.snow.automation.functionLibrary.Filter_Navigator;
import com.izt.snow.automation.functionLibrary.IM;
import com.izt.snow.automation.functionLibrary.LogIn_Out;
import com.izt.snow.automation.functionLibrary.PM;
import com.izt.snow.automation.pageObject.Elements;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;

public class test1 {

	public static void main(String[] args) throws InterruptedException, EncryptedDocumentException, InvalidFormatException, IOException {
		
		

Driver.getDriver("firefox");
String ola="https://anitechnologiesdev.service-now.com/login.do";
String virtusa="https://virtusadev.service-now.com/side_door.do";
String dev="https://dev26104.service-now.com";
String ub="https://unitedbreweriesdev.service-now.com/";
String yd="https://yodleesandbox.service-now.com";
Driver.driver.manage().window().maximize();


Driver.driver.get(dev);
LogIn_Out log=new LogIn_Out();
PM pm=new PM();
Filter_Navigator filter=new Filter_Navigator();

IM im=new IM();
BaseClass baseMethod=new BaseClass();
ElementExtraction ee=new ElementExtraction();
Elements ele=PageFactory.initElements(Driver.driver,Elements.class);



//log.log("it_agent", "12345");
//log.log("izt.agent", "izt");
//log.log("madhuri.izt", "123");
//log.log("izt.neha", "12345");
log.log("bharath", "12345");
Driver.driver.manage().timeouts().pageLoadTimeout(20,TimeUnit.SECONDS);
//Thread.sleep(5000);

filter.navigator("problem", "Create New");
baseMethod.pageLoadWait();
//ee.problemElements();
pm.problemDataInsertion();
baseMethod.pageLoadWait();
String ticket=baseMethod.readData("problemNumber", "problem.properties");
filter.openExistingTicket(ticket, "problem");
baseMethod.pageLoadWait();
Thread.sleep(5000);


pm.problemStatusUpdate();
baseMethod.pageLoadWait();
filter.openExistingTicket(ticket, "problem");
//ee.problemElements();

//baseMethod.pageLoadWait();
//Thread.sleep(5000);
//im.incidentDataInsertion();

//t.divTest();


System.out.println("completed");
		
		
		
		
	}

}
