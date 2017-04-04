package com.izt.snow.automation.PrerequisiteData;

import java.io.IOException;

import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.testng.ITestResult;
import org.testng.annotations.Test;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.AfterClass;

import com.izt.snow.automation.functionLibrary.ElementExtraction;
import com.izt.snow.automation.functionLibrary.Filter_Navigator;
import com.izt.snow.automation.functionLibrary.IM;
import com.izt.snow.automation.functionLibrary.LogIn_Out;
import com.izt.snow.automation.functionLibrary.preConditions;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;
/**
 * 
 * @author Bharath
 *
 */
/*
 * Prerequisite Data Capturing from Modules and writing to Excel Sheet.
 * Step 1: Loging into Application
 * Step 2: Navigating to Modules
 * Step 3: Capturig all Fields Labels and Tags 
 * Step 4: Writing Labels , Values and Tags into Excel Sheet and parameter Files.
 * Step 5: Loging Out from Aplication
 * Step 6:Closing Browser
 * 
 */
public class PrerequisiteDataInsertion  {
	
	Filter_Navigator filter;
	ElementExtraction extract;
	LogIn_Out log;
	IM im;
	BaseClass baseMethod;
	preConditions pre;
	

	@BeforeClass
	public void beforeClass() {

		filter = new Filter_Navigator();
		extract = new ElementExtraction();
		log = new LogIn_Out();
		baseMethod = new BaseClass();
		im = new IM();
		pre=new preConditions();
	}

	@BeforeMethod
	public void beforeMethod() throws EncryptedDocumentException,
			InvalidFormatException, IOException {
		
		String url = baseMethod.getExcelData("Credentials", 2, 3);
		String userName = baseMethod.getExcelData("Credentials", 2, 1);
		String Password = baseMethod.getExcelData("Credentials", 2, 2);
		Driver.getDriver("firefox");
		Driver.driver.manage().window().maximize();
		Driver.driver.get(url);
		log.log(userName, Password);

	}

	/*
	 * Capturing All Fileds Labels and Tag Names and Writing to Excel Sheet and
	 * Properties Files
	 */
		
	@Test
	public void incidentPrerequisiteData() throws InterruptedException,
			EncryptedDocumentException, InvalidFormatException, IOException {

		baseMethod.pageLoadWait();
		filter.navigator("Incident", "Create New");
		baseMethod.pageLoadWait();
		extract.IncidentElements();
	}

	@AfterMethod
	public void afterMethod(ITestResult t) throws InterruptedException, IOException {

		if (t.isSuccess()) {

			log.logout();
		} else {
			/* Capturing Screen if Method Fails */
			String fileName = t.getMethod().getMethodName();
			baseMethod.getScreenShot(fileName);
			log.logout();
		}
	}

	@AfterClass
	public void afterClass() {

		baseMethod.quit();
	}

}
