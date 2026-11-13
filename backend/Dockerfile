# Backend Spring Boot. Build em duas etapas: Maven compila, a imagem final só tem o JRE e o jar.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
# Usuário sem privilégios: a API não precisa de root.
RUN useradd -r -u 1001 app
COPY --from=build /src/target/tem-direito-backend.jar app.jar
USER app
EXPOSE 8081
HEALTHCHECK --interval=20s --timeout=3s --start-period=60s CMD wget -qO- http://localhost:8081/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
