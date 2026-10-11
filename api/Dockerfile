FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY FormManagementApi/FormManagementApi.csproj FormManagementApi/
RUN dotnet restore FormManagementApi/FormManagementApi.csproj

COPY FormManagementApi/ FormManagementApi/
RUN dotnet publish FormManagementApi/FormManagementApi.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5165
EXPOSE 5165

ENTRYPOINT ["dotnet", "FormManagementApi.dll"]
