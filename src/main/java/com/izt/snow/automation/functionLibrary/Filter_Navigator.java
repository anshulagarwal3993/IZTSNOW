package com.izt.snow.automation.functionLibrary;


import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import com.izt.snow.automation.pageObject.Elements;
import com.izt.snow.automation.pageObject.HomePage_Repository;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;
import com.thoughtworks.selenium.condition.Presence;

/**
 * 
 * @author Bharath
 * 
 */

public class Filter_Navigator {
	/**
	 * Side Navigater/ Search Bar(Top Left)
	 * 
	 * Step 1: Passing user inputs into Search Bar
	 * Setp 2: Based on input it navigates to Sub-Menu
	 * Setp 3: Click on Expected Value on Sub-Menu
	 * Step 4: Navigates to Expected Page
	 *  
	 * @param filterSearch
	 * @param exceptedValue
	 * @throws InterruptedException
	 */

	BaseClass baseMethod = new BaseClass();
	
	public void navigator(String filterSearch, String exceptedValue)
			throws InterruptedException {

		HomePage_Repository home = PageFactory.initElements(Driver.driver,
				HomePage_Repository.class);
		WebDriverWait wait=new WebDriverWait(Driver.driver, 10);
		String id = "";
		baseMethod.pageLoadWait();
		/* Trying to do Action with out enterting into Frame */
		try {
			wait.until(ExpectedConditions.visibilityOf(home.getFilterNavigaterEdit()));
			home.getFilterNavigaterEdit().sendKeys(filterSearch);
			

			/* Incident Sub-Menu List */
			if (filterSearch.equalsIgnoreCase("incident")) {

				switch (exceptedValue) {

				case "Create New":
					id = "14641d70c611228501114133b3cc88a1";
					break;
				case "All":
					id = "b55b4ab0c0a80009007a9c0f03fb4da9";
					break;

				}
				/* Problem Sub-Menu List */
			} else if (filterSearch.equalsIgnoreCase("problem")) {

				switch (exceptedValue) {

				case "Create New":
					id = "a1beba50c611227801908558c921ab78";
					break;
				case "All":
					id = "b55f73f8c0a800090175ace6ae472053";
					break;

				}

			}
			wait.until(ExpectedConditions.elementToBeClickable(Driver.driver.findElement(By.id(id))));
			Driver.driver.findElement(By.id(id)).click();
			baseMethod.pageLoadWait();

			/*
			 * Catching exception and switching to Frame and performing  User Action
			 * and comig back to Default Frame
			 */
		} catch (Exception e) {

			Driver.driver.switchTo().defaultContent();
			Driver.driver.switchTo().frame("gsft_nav");
			wait.until(ExpectedConditions.visibilityOf(home.getFilterNavigaterEdit()));
			home.getFilterNavigaterEdit().sendKeys(filterSearch);
		

			/* Incident Sub-Menu List */
			if (filterSearch.equalsIgnoreCase("incident")) {

				switch (exceptedValue) {

				case "Create New":
					id = "14641d70c611228501114133b3cc88a1";
					break;
				case "All":
					id = "b55b4ab0c0a80009007a9c0f03fb4da9";
					break;

				}

				/* Problem Sub-Menu List */
			} else if (filterSearch.equalsIgnoreCase("problem")) {

				switch (exceptedValue) {

				case "Create New":
					id = "a1beba50c611227801908558c921ab78";
					break;
				case "All":
					id = "b55f73f8c0a800090175ace6ae472053";
					break;

				}

			}
			wait.until(ExpectedConditions.elementToBeClickable(Driver.driver.findElement(By.id(id))));
			Driver.driver.findElement(By.id(id)).click();
			baseMethod.pageLoadWait();

		}
		Thread.sleep(5000);

	}

	/**
	 * 
	 * @param ticket
	 */
	public void searchTicket(String ticket) {

		HomePage_Repository home = PageFactory.initElements(Driver.driver,
				HomePage_Repository.class);

		BaseClass baseMethod = new BaseClass();

		baseMethod.switchTo().defaultContent();
		baseMethod.switchToFrame("gsft_main");
		baseMethod.selectDropdown(home.getGoToSearchDropDown(), "Number");
		home.getSearchGoToEdit().sendKeys(ticket);
		baseMethod.actions();
		baseMethod.pageLoadWait();

	}

	/**
	 *  Opening Existing Ticket using Ticket Number
	 *  
	 * @param ticket
	 * @throws InterruptedException 
	 */
	public void openExistingTicket(String ticket,String module) throws InterruptedException {
		
		Elements ele=PageFactory.initElements(Driver.driver,Elements.class);
		
		
		Driver.driver.switchTo().defaultContent();
		Driver.driver.switchTo().frame("gsft_main");

		String dropDown = ele.getSearchDropDown().getAttribute("id");
		WebElement dropdown = Driver.driver.findElement(By.id(dropDown));

		baseMethod.selectDropdown(dropdown, "Number");
		Thread.sleep(2000);

		String inputElement = ele.getSearchInputEdit().getAttribute("id");

		Driver.driver.findElement(By.id(inputElement)).sendKeys(ticket);
		Thread.sleep(2000);
		baseMethod.actions();
		baseMethod.pageLoadWait();
		Thread.sleep(2000);
String path="//table[@id='"+module+"_table']/descendant::tr[@id='hdr_"+module+"']/th";
		List<WebElement> lst = Driver.driver.findElements(By.xpath(path));
		String cell = "";
		for (int i = 0; i < lst.size(); i++) {
			try {
				String name = lst.get(i).getAttribute("name");
				if (name.equalsIgnoreCase("Number")) {
					cell = String.valueOf(i + 1);
					
					break;
				}
			} catch (Exception e) {
				
			}

		}
		Thread.sleep(3000);
		Driver.driver.findElement(
				By.xpath("//tr[contains(@id,'row_"+module+"')]/td[" + cell
						+ "]/a")).click();

	}
	/*
	 * Fetching Filter Navigater Sub menu List
	 */
	public void navigate(String search) throws InterruptedException{
		
		try{
		String path="//label[contains(text(),'"+search+"')]/following-sibling::ul/li";
		List<WebElement> lst= Driver.driver.findElements(By.xpath(path));
		baseMethod.selectFromList(lst, "Create New");
		}catch(Exception e){
			
			String path="//span[a[contains(text(),'"+search+"')]]/following-sibling::ul/li";
			List<WebElement> lst= Driver.driver.findElements(By.xpath(path));
			baseMethod.selectFromList(lst, "Create New");
		}
		Thread.sleep(5000);
	}

}
