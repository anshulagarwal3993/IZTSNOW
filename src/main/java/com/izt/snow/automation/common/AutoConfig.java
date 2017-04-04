
package com.izt.snow.automation.common;

import java.io.File;

import org.apache.commons.configuration2.Configuration;
import org.apache.commons.configuration2.FileBasedConfiguration;
import org.apache.commons.configuration2.PropertiesConfiguration;
import org.apache.commons.configuration2.builder.FileBasedConfigurationBuilder;
import org.apache.commons.configuration2.builder.fluent.Configurations;
import org.apache.commons.configuration2.builder.fluent.Parameters;
import org.apache.commons.configuration2.ex.ConfigurationException;

/**
 * Manages the configuration and execution property files.
 * 
 * @author siddharth ravindran
 *
 */
public class AutoConfig {

	private static Configuration config;
	private static Configuration execProp;
	private static FileBasedConfigurationBuilder<FileBasedConfiguration> builder;
	
	static {
		Configurations configs = new Configurations();
		try {
			config = configs.properties(new File(Common.CONF_PROP_FILE));
		} catch (ConfigurationException cex) {
			System.out.println("Error loading Config file " + Common.CONF_PROP_FILE);
			cex.printStackTrace();
		}
		try {

			Parameters params = new Parameters();
			builder = new FileBasedConfigurationBuilder<FileBasedConfiguration>(PropertiesConfiguration.class)
					.configure(params.properties().setFileName(Common.EXECUTION_PROP_FILE));
			execProp = builder.getConfiguration();

		} catch (ConfigurationException cex) {
			System.out.println("Error loading Execution property file " + Common.EXECUTION_PROP_FILE);
			cex.printStackTrace();
		}
	}

	/**
	 * Returns the configuration value from conf file
	 * 
	 */
	public static String getConfiguration(String key) {
		return config.getString(key);
	}

	/**
	 * Returns the property value from execution property file

	 */
	public static String getExecutionProperty(String key) {
		return execProp.getString(key);
	}

	/**
	 * Set execution configuration
	 * 
	 */
	public static void setExecutionConf(String key, String value) {
		execProp.setProperty(key, value);
	}

	/**
	 * Save execution configuration
	 */
	public static void saveExecutionConfChanges() {
		try {
			builder.save();
		} catch (ConfigurationException e) {
			e.printStackTrace();
		}
	}

}
