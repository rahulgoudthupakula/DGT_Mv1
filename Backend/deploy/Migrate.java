import org.flywaydb.core.Flyway;
/** Run separately from the application, using migration credentials only. */
class Migrate {
    public static void main(String[] args) {
        if (args.length != 1) throw new IllegalArgumentException("Supply the migrations directory");
        Flyway.configure().dataSource(System.getenv("FLYWAY_URL"), System.getenv("FLYWAY_USER"), System.getenv("FLYWAY_PASSWORD"))
            .locations("filesystem:" + args[0]).baselineVersion("1").baselineOnMigrate(false)
            .cleanDisabled(true).validateOnMigrate(true).load().migrate();
    }
}
