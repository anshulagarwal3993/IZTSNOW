package com.izt.snow.automation.webdriver;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.ie.InternetExplorerDriver;


/**
 * 
 * @author Bharath
 *
 */
public class Driver {
	
/*provide driver instance @ run time it will choose which driver to launch*/
	
	public static WebDriver driver;
	/**
	 * 
	 * @param browser
	 * @return
	 */
	public static WebDriver getDriver(String browser){
		
		if(browser.equalsIgnoreCase("firefox")){
			
			// setting up the path for my Firefox Driver
				driver=new FirefoxDriver();
			
		}else if (browser.equalsIgnoreCase("ie")) { 
			 
			  // setting up the path for my IEDriver
		 
				System.setProperty("webdriver.ie.driver", "C:\\IEDriverServer.exe");
			
			  //create IE instance
				Driver.driver = new InternetExplorerDriver();
		 
		  }else if(browser.equalsIgnoreCase("chrome")){
			  
			// setting up the path for my Chrome Driver
			  	System.setProperty("webdriver.chrome.driver","C:\\chromedriver.exe");

	            //create chrome instance
	            Driver.driver = new ChromeDriver();
		  }
		
		else{
				driver=new FirefoxDriver();
		}
				return driver;
	}

}
