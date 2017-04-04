package com.izt.snow.automation.functionLibrary;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import com.izt.snow.automation.pageObject.HomePage_Repository;
import com.izt.snow.automation.pageObject.LogInPage;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;
/**
 * 
 * @author Bharath
 *
 */
public class LogIn_Out {
/*
 * Logging to Application 
 * 
 * Step 1:Fetching Frame Id and trying to Switch to Frame if Frame Exists
 * Step 2:Entering User Creadentials 
 * Step 3:Clicking on Loging/Submit Button
 * Step 4:Navigating to Home Page
 */
	/* Creating objects for Base clase */

	BaseClass baseMethod = new BaseClass();

	public void log(String userName, String Password) {

		/* Creating Objects for PageObjects Using PageFactory Design Patters */
		LogInPage log = PageFactory
				.initElements(Driver.driver, LogInPage.class);

		/* Entering User Creadentials With out Switching to Frame */
		try {

			log.getUserNameEdit().sendKeys(userName);
			log.getPasswordEdit().sendKeys(Password);
			log.getLogInButton().click();

			/* Switching to Frame and Entering User Creadentials */
		} catch (Exception e) {

			List<WebElement> lst = Driver.driver.findElements(By
					.xpath("//iframe"));
			int count = lst.size();
			for (int i = 0; i < count; i++) {
				String id = lst.get(i).getAttribute("id");

				Driver.driver.switchTo().frame(id);
			}

			log.getUserNameEdit().sendKeys(userName);
			log.getPasswordEdit().sendKeys(Password);
			log.getLogInButton().click();

		}

	}

	/**
	 * Logout From Application
	 * 
	 * Step 1: Clicking on UserDrop down (For UI 16)/ Directly clicking on Logout Button(UI 15)
	 * Step 2: Clicking on Logout Link at User Drop down list
	 * 
	 * @throws InterruptedException
	 */
	public void logout() throws InterruptedException {

		HomePage_Repository home = PageFactory.initElements(Driver.driver,
				HomePage_Repository.class);

		Driver.driver.switchTo().defaultContent();
		baseMethod.pageLoadWait();
		Thread.sleep(3000);
		try {

			home.getLogoutButton().click();
		} catch (Exception e) {

			home.getUserInfoDropDownButton().click();
			Thread.sleep(2000);
			home.getLogoutLink().click();
		}

	}

}
