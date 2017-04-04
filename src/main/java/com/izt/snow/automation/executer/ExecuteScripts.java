package com.izt.snow.automation.executer;

import java.io.File;
import java.util.List;

import org.testng.TestListenerAdapter;
import org.testng.TestNG;
import org.testng.collections.Lists;



public class ExecuteScripts {

	
	public static void main(String[] args){
		
		
		TestListenerAdapter tla = new TestListenerAdapter();
		TestNG testng = new TestNG();
		List<String> suites = Lists.newArrayList();
		
		
		
			String path = "F:\\workspace\\IZTGenericAutomationTestSuit\\IM.xml";

			File file = new File(path);
			if (file.exists()) {
				suites.add(path);
				testng.setTestSuites(suites);
				testng.run();
			} else {
				System.out.println("Invalied File Path");
			}
		
			
			
	
		
		
	}
	
	
	public void performExecution(String module) {

		
		TestListenerAdapter tla = new TestListenerAdapter();
		TestNG testng = new TestNG();
		List<String> suites = Lists.newArrayList();
		
		if(module.equalsIgnoreCase("0")){
		
			String path = "F:\\workspace\\IZTGenericAutomationTestSuit\\IM.xml";

			File file = new File(path);
			if (file.exists()) {
				suites.add(path);
				testng.setTestSuites(suites);
				testng.run();
			} else {
				System.out.println("Invalied File Path");
			}
		} else if (module.equalsIgnoreCase("1")) {
			
			String path = "F:\\workspace\\IZTGenericAutomationTestSuit\\IM.xml";

			File file = new File(path);
			if (file.exists()) {
				suites.add(path);
				testng.setTestSuites(suites);
				testng.run();
			} else {
				System.out.println("Invalied File Path");
			}
		} else {
			
			
			
		}
	}

	
}
