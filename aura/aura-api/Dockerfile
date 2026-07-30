FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["src/Aura.API/Aura.API.csproj", "src/Aura.API/"]
COPY ["src/Aura.Application/Aura.Application.csproj", "src/Aura.Application/"]
COPY ["src/Aura.Domain/Aura.Domain.csproj", "src/Aura.Domain/"]
COPY ["src/Aura.Infrastructure/Aura.Infrastructure.csproj", "src/Aura.Infrastructure/"]

RUN dotnet restore "src/Aura.API/Aura.API.csproj"

COPY . .
WORKDIR "/src/src/Aura.API"
RUN dotnet publish "Aura.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Aura.API.dll"]
