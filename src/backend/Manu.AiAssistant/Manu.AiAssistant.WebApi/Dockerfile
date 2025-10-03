# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY *.csproj ./
RUN dotnet restore *.csproj

# Copy everything else and build
COPY . ./
RUN dotnet publish Manu.AiAssistant.WebApi.csproj -c Release -o /app/publish --no-restore

# Stage 2: Serve
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./

EXPOSE 80

ENTRYPOINT ["dotnet", "Manu.AiAssistant.WebApi.dll"]
