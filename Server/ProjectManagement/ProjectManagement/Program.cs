using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectManagement.Data;
using ProjectManagement.Models;
using System.Text;
using System.Reflection;
using FluentValidation;
using FluentValidation.AspNetCore;
using ProjectManagement.AccessRequirement.Services;
using Microsoft.AspNetCore.Authorization;
using ProjectManagement.AccessRequirement;
using System.IdentityModel.Tokens.Jwt;
using ProjectManagement.Features.Tasks;
using ProjectManagement.Hubs;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("CORS", policy =>
    {
        policy.WithOrigins("http://localhost:5173").WithOrigins("https://taskly-a17kxl2y4-svu8.vercel.app")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.AddMediatR(cfg=>cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

//builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

// Add FluentValidation's automatic validation to the ASP.NET Core pipeline
builder.Services.AddFluentValidationAutoValidation()
                .AddFluentValidationClientsideAdapters()
                .AddValidatorsFromAssembly(typeof(Program).Assembly);

// Register the consolidated project access service
builder.Services.AddScoped<IProjectAccessService, ProjectAccessService>();

// Keep task member service for task-specific authorization
builder.Services.AddScoped<ITaskMemberService, TaskMemberService>();
builder.Services.AddScoped<ITaskFileStorageService, TaskFileStorageService>();


builder.Services.AddScoped<IAuthorizationHandler, ProjectAccessHandler>();
builder.Services.AddScoped<IAuthorizationHandler, TaskAccessHandler>();

builder.Services.AddAuthorization(options =>
{

    options.AddPolicy("ProjectOwner", policy =>
        policy.Requirements.Add(new ProjectAccessRequirement { RequireOwner = true }));
    options.AddPolicy("ProjectManagerOrOwner", policy =>
        policy.Requirements.Add(new ProjectAccessRequirement { RequireOwner = true, RequireManager = true }));
    options.AddPolicy("ProjectAny", policy =>
        policy.Requirements.Add(new ProjectAccessRequirement { RequireOwner = true, RequireManager = true, RequireMember = true }));

    options.AddPolicy("TaskMember", policy =>
        policy.Requirements.Add(new TaskAccessRequirement { RequireMember = true , RequireManager = true,RequireOwner = true }));

    options.AddPolicy("TaskManagerOrOwner", policy =>
        policy.Requirements.Add(new TaskAccessRequirement { RequireManager = true, RequireOwner = true }));
    
    
});


builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default"));
});
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders()
    ;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
                {
                    context.Token = accessToken; // حقن التوكن في السوكيت
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.Configure<ClaimsIdentityOptions>(options =>
{
    options.UserIdClaimType = JwtRegisteredClaimNames.Sub;
    options.UserNameClaimType = JwtRegisteredClaimNames.Name;
    options.RoleClaimType = "role";
});
builder.Services.AddSingleton<IUserIdProvider, CustomUserIdProvider>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; 
});

var app = builder.Build();

var webRootPath = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRootPath, "uploads"));

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("CORS");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<ProjectHub>("/hubs/project");
app.MapHub<TaskHub>("/hubs/task");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ActivityHub>("/hubs/activity");

app.Run();
