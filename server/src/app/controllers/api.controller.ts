import { Body, Controller, Get, Post, Query, Param } from "@nestjs/common";
import { IPageCreateOptions } from "@amoebajs/builder";
import { Compiler } from "#global/services/compile.service";
import { User } from "#global/services/user.service";
import { SetRoles, UseRolesAuthentication } from "#utils/roles";
import { MysqlWorker } from "#database/providers/worker.service";

@Controller("api")
@UseRolesAuthentication({ roles: ["admin"] })
export class ApiController {
  constructor(private readonly compiler: Compiler, private readonly worker: MysqlWorker, private readonly user: User) {}

  @Get("user")
  @SetRoles("admin")
  public getUserInfos() {
    return {
      code: 0,
      data: this.user.infos,
    };
  }

  @Get("pages")
  @SetRoles("admin")
  public async queryPagelist(
    @Query("current") current: string,
    @Query("size") size: string,
    @Query("name") name: string,
  ) {
    return {
      code: 0,
      data: await this.worker.queryList("PAGE", { name, current: +current, size: +size }),
    };
  }

  @Get("page/:id/configs")
  @SetRoles("admin")
  public async queryPageConfiglist(
    @Param("id") pageId: string,
    @Query("current") current: string,
    @Query("size") size: string,
    @Query("name") name: string,
  ) {
    return {
      code: 0,
      data: await this.worker.queryList("VERSION", { name, pageId, current: +current, size: +size }),
    };
  }

  @Get("page/:id/versions")
  @SetRoles("admin")
  public async queryPageVersionlist(
    @Param("id") pageId: string,
    @Query("current") current: string,
    @Query("size") size: string,
    @Query("name") name: string,
  ) {
    return {
      code: 0,
      data: await this.worker.queryList("VERSION", { name, current: +current, size: +size }),
    };
  }

  @Get("page/:id")
  @SetRoles("admin")
  public async getPageDetails(@Param("id") id: string) {
    return {
      code: 0,
      data: await this.worker.query("PAGE", { id }),
    };
  }

  @Get("page/:id/version/:vid")
  @SetRoles("admin")
  public async getPageVersionDetails(@Param("id") _: string, @Param("vid") id: string) {
    return {
      code: 0,
      data: await this.worker.query("VERSION", { id }),
    };
  }

  @Get("page/:id/config/:cid")
  @SetRoles("admin")
  public async getPageConfigDetails(@Param("id") pageId: string, @Param("cid") id: string) {
    return {
      code: 0,
      data: await this.worker.query("CONFIG", { id, pageId }),
    };
  }

  @Post("preview")
  @SetRoles("super-admin")
  public async createSourcePreview(@Body() data: any) {
    console.log("create preview ==> ");
    console.log(data);
    const { configs: others } = data;
    const { source, dependencies } = await this.compiler.createSourceString(others, {
      enabled: true,
      jsx: "react",
      target: "es2015",
      module: "es2015",
    });
    return {
      code: 0,
      data: {
        source,
        dependencies,
        configs: data,
      },
    };
  }

  @Post("page")
  @SetRoles("super-admin")
  public async createPage(
    @Body("name") name?: string,
    @Body("displayName") displayName?: string,
    @Body("description") description?: string,
  ) {
    return {
      code: 0,
      data: await this.worker.createPage({
        name,
        displayName,
        description,
        operator: String(this.user.infos.id),
      }),
    };
  }

  @Post("task")
  @SetRoles("super-admin")
  public async createtask(
    @Body("name") name: string,
    @Body("configs") options: IPageCreateOptions,
    @Body("displayName") displayName?: string,
    @Body("description") description?: string,
  ) {
    return {
      code: 0,
      data: {
        id: await this.compiler.createTask({
          name,
          displayName,
          description,
          options,
          creator: String(this.user.infos.id),
        }),
        creator: String(this.user.infos.id),
        configs: options,
      },
    };
  }

  @Get("task/:id")
  @SetRoles("admin")
  public async gettask(@Param("id") id: string) {
    const result = await this.compiler.queryTask(id);
    if (!result) {
      return {
        code: 404,
        data: {
          id: -1,
          errorMsg: `task[${id}] not found`,
        },
      };
    }
    return { code: 0, data: result };
  }
}
