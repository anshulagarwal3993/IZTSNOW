package com.izt.snow.automation.incidentmanagement;

import java.io.IOException;

import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.testng.ITestResult;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import com.izt.snow.automation.functionLibrary.Filter_Navigator;
import com.izt.snow.automation.functionLibrary.IM;
import com.izt.snow.automation.functionLibrary.LogIn_Out;
import com.izt.snow.automation.functionLibrary.ElementExtraction;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;



public class Incident_Management {

Filter_Navigator filter;
ElementExtraction extract;
LogIn_Out log;
IM im;
BaseClass baseMethod;
	
	@BeforeClass
	public void beforeClass() throws EncryptedDocumentException, InvalidFormatException, IOException{
		
		filter=new Filter_Navigator();
		extract=new ElementExtraction();
		log=new LogIn_Out();
		baseMethod=new BaseClass();
		im=new IM();
		String url=baseMethod.getExcelData("Credentials", 2, 3);
		String userName=baseMethod.getExcelData("Credentials", 2, 1);
		String Password=baseMethod.getExcelData("Credentials", 2, 2);
		Driver.getDriver("firefox");
		Driver.driver.manage().window().maximize();
		Driver.driver.get(url);
		log.log(userName, Password);
	}
	@BeforeMethod
	public void beforeMethod() throws EncryptedDocumentException, InvalidFormatException, IOException{
		
		
		
	}
	@Test
	public void TC_001() throws InterruptedException, EncryptedDocumentException, InvalidFormatException, IOException{
		baseMethod.pageLoadWait();
		filter.navigator("Incident", "Create New");
		baseMethod.pageLoadWait();
		im.incidentDataInsertion();
		baseMethod.pageLoadWait();
		Thread.sleep(5000);
		
		
		
		
		
		
	}
	@Test
	public void TC_002() throws InterruptedException, EncryptedDocumentException, InvalidFormatException, IOException{
		
		String ticket=baseMethod.readData("ticketNumber", "incident.properties");
		filter.openExistingTicket(ticket,"incident");
		baseMethod.pageLoadWait();
		Thread.sleep(3000);
		im.incidentStatusUpdate();
		
		
		
	}
	@AfterMethod
	public void afterMethod(ITestResult t) throws InterruptedException, IOException{
		
		if (t.isSuccess()) {

			
		} else {
			/* Capturing Screen if Method Fails */
			String fileName = t.getMethod().getMethodName();
			baseMethod.getScreenShot(fileName);
			
		}
		
		
	}
	@AfterClass
	public void afterClass() throws InterruptedException, IOException{
		

			log.logout();
	
		
		
	//	baseMethod.quit();
		
	}
	
	
}
